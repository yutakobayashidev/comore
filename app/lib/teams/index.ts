import { drizzle } from "drizzle-orm/d1";
import { and, eq, sql } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { nanoid } from "nanoid";
import schema, {
  teams,
  teamMembers,
  teamInvitations,
  subscriptions,
} from "../../../database/schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

export async function createTeam(
  db: DB,
  data: {
    name: string;
    slug: string;
    creatorUserId: number;
  },
) {
  const now = new Date();
  const teamId = nanoid();

  const team = await db
    .insert(teams)
    .values({
      id: teamId,
      name: data.name,
      slug: data.slug,
      hasActiveSubscription: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  await db.insert(teamMembers).values({
    id: nanoid(),
    teamId: team.id,
    userId: data.creatorUserId,
    role: "admin",
    joinedAt: now,
  });

  return team;
}

export async function getUserTeams(db: DB, userId: number) {
  return await db
    .select({
      team: teams,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId));
}

export async function getTeamById(db: DB, teamId: string) {
  return await db.select().from(teams).where(eq(teams.id, teamId)).get();
}

export async function getTeamBySlug(db: DB, slug: string) {
  return await db.select().from(teams).where(eq(teams.slug, slug)).get();
}

export async function getTeamMembers(db: DB, teamId: string) {
  return await db
    .select({
      member: teamMembers,
      user: schema.users,
    })
    .from(teamMembers)
    .innerJoin(schema.users, eq(teamMembers.userId, schema.users.id))
    .where(eq(teamMembers.teamId, teamId));
}

export async function isUserTeamAdmin(
  db: DB,
  userId: number,
  teamId: string,
): Promise<boolean> {
  const membership = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.role, "admin"),
      ),
    )
    .get();

  return !!membership;
}

export async function canUserCreateTeam(
  db: DB,
  userId: number,
): Promise<boolean> {
  const userSubscription = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")),
    )
    .get();

  return !!userSubscription;
}

export async function createTeamInvitation(
  db: DB,
  data: {
    teamId: string;
    invitedByUserId: number;
    expiresInDays?: number;
  },
) {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (data.expiresInDays || 7) * 24 * 60 * 60 * 1000,
  );

  return await db
    .insert(teamInvitations)
    .values({
      id: nanoid(),
      teamId: data.teamId,
      invitedByUserId: data.invitedByUserId,
      token: nanoid(32),
      expiresAt,
      createdAt: now,
    })
    .returning()
    .get();
}

export async function acceptTeamInvitation(
  db: DB,
  data: {
    token: string;
    userId: number;
  },
) {
  const now = new Date();

  const invitation = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.token, data.token),
        sql`${teamInvitations.expiresAt} > ${now.getTime()}`,
        sql`${teamInvitations.usedAt} IS NULL`,
      ),
    )
    .get();

  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(teamInvitations)
      .set({
        usedAt: now,
        usedByUserId: data.userId,
      })
      .where(eq(teamInvitations.id, invitation.id));

    await tx.insert(teamMembers).values({
      id: nanoid(),
      teamId: invitation.teamId,
      userId: data.userId,
      role: "member",
      joinedAt: now,
    });
  });

  return invitation;
}

export async function updateTeamSubscriptionStatus(
  db: DB,
  teamId: string,
): Promise<void> {
  const adminsWithSubscription = await db
    .select({ count: sql<number>`count(*)` })
    .from(teamMembers)
    .innerJoin(schema.users, eq(teamMembers.userId, schema.users.id))
    .innerJoin(subscriptions, eq(schema.users.id, subscriptions.userId))
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.role, "admin"),
        eq(subscriptions.status, "active"),
      ),
    )
    .get();

  const hasActiveSubscription = (adminsWithSubscription?.count ?? 0) > 0;

  await db
    .update(teams)
    .set({
      hasActiveSubscription,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function removeTeamMember(
  db: DB,
  data: {
    teamId: string;
    userId: number;
  },
): Promise<void> {
  await db
    .delete(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, data.teamId),
        eq(teamMembers.userId, data.userId),
      ),
    );

  await updateTeamSubscriptionStatus(db, data.teamId);
}

export async function getActiveAdminCount(
  db: DB,
  teamId: string,
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(teamMembers)
    .innerJoin(schema.users, eq(teamMembers.userId, schema.users.id))
    .innerJoin(subscriptions, eq(schema.users.id, subscriptions.userId))
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.role, "admin"),
        eq(subscriptions.status, "active"),
      ),
    )
    .get();

  return result?.count ?? 0;
}

export async function transferTeamOwnership(
  db: DB,
  data: {
    teamId: string;
    fromUserId: number;
    toUserId: number;
  },
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(teamMembers)
      .set({ role: "member" })
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, data.fromUserId),
        ),
      );

    await tx
      .update(teamMembers)
      .set({ role: "admin" })
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, data.toUserId),
        ),
      );
  });
}

export async function deleteTeam(db: DB, teamId: string): Promise<void> {
  await db.delete(teams).where(eq(teams.id, teamId));
}
