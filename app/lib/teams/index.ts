import { and, eq, sql, gt, isNull, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { uuidv7 } from "uuidv7";
import schema, {
  teams,
  teamMembers,
  teamInvitations,
  subscriptions,
} from "../../../database/schema";
import type {
  Team,
  TeamInvitation,
  CreateTeamParams,
  CreateTeamInvitationParams,
  AcceptTeamInvitationParams,
  RemoveTeamMemberParams,
  TransferTeamOwnershipParams,
  UserTeamInfo,
  TeamMemberWithUser,
  PaginationOptions,
} from "./interface";

type DB = DrizzleD1Database<typeof schema>;

export const createTeam =
  (db: DB) =>
  async (data: CreateTeamParams): Promise<Team> => {
    const now = new Date();
    const teamId = uuidv7();

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
      id: uuidv7(),
      teamId: team.id,
      userId: data.creatorUserId,
      role: "admin",
      joinedAt: now,
    });

    return team;
  };

export const getUserTeams =
  (db: DB) =>
  async (
    userId: number,
    options?: PaginationOptions,
  ): Promise<UserTeamInfo[]> => {
    const baseQuery = db
      .select({
        team: teams,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId))
      .orderBy(teamMembers.joinedAt);

    if (options?.limit && options?.offset !== undefined) {
      return await baseQuery.limit(options.limit).offset(options.offset);
    } else if (options?.limit) {
      return await baseQuery.limit(options.limit);
    } else if (options?.offset !== undefined) {
      return await baseQuery.offset(options.offset);
    }

    return await baseQuery;
  };

export const getTeamById =
  (db: DB) =>
  async (teamId: string): Promise<Team | undefined> => {
    return await db.select().from(teams).where(eq(teams.id, teamId)).get();
  };

export const getTeamBySlug =
  (db: DB) =>
  async (slug: string): Promise<Team | undefined> => {
    return await db.select().from(teams).where(eq(teams.slug, slug)).get();
  };

export const getTeamMembers =
  (db: DB) =>
  async (
    teamId: string,
    options?: PaginationOptions,
  ): Promise<TeamMemberWithUser[]> => {
    const baseQuery = db
      .select({
        member: teamMembers,
        user: schema.users,
      })
      .from(teamMembers)
      .innerJoin(schema.users, eq(teamMembers.userId, schema.users.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(teamMembers.joinedAt);

    if (options?.limit && options?.offset !== undefined) {
      return await baseQuery.limit(options.limit).offset(options.offset);
    } else if (options?.limit) {
      return await baseQuery.limit(options.limit);
    } else if (options?.offset !== undefined) {
      return await baseQuery.offset(options.offset);
    }

    return await baseQuery;
  };

export const isUserTeamAdmin =
  (db: DB) =>
  async (userId: number, teamId: string): Promise<boolean> => {
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
  };

export const hasActiveSubscription =
  (db: DB) =>
  async (userId: number): Promise<boolean> => {
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, ["active", "complete"]),
        ),
      )
      .get();

    return !!userSubscription;
  };

export const getUsersWithActiveSubscription =
  (db: DB) =>
  async (userIds: number[]): Promise<Set<number>> => {
    if (userIds.length === 0) return new Set();

    const activeSubscriptions = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(
        and(
          inArray(subscriptions.userId, userIds),
          inArray(subscriptions.status, ["active", "complete"]),
        ),
      );

    return new Set(activeSubscriptions.map((sub) => sub.userId));
  };

export const createTeamInvitation =
  (db: DB) =>
  async (data: CreateTeamInvitationParams): Promise<TeamInvitation> => {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (data.expiresInDays || 7) * 24 * 60 * 60 * 1000,
    );

    return await db
      .insert(teamInvitations)
      .values({
        id: uuidv7(),
        teamId: data.teamId,
        invitedByUserId: data.invitedByUserId,
        token: uuidv7(),
        expiresAt,
        createdAt: now,
      })
      .returning()
      .get();
  };

export const acceptTeamInvitation =
  (db: DB) =>
  async (data: AcceptTeamInvitationParams): Promise<TeamInvitation> => {
    const now = new Date();

    const invitation = await db
      .select()
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.token, data.token),
          gt(teamInvitations.expiresAt, now),
          isNull(teamInvitations.usedAt),
        ),
      )
      .get();

    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, invitation.teamId),
          eq(teamMembers.userId, data.userId),
        ),
      )
      .get();

    if (existingMembership) {
      throw new Error("Already a member of this team");
    }

    await db.batch([
      db
        .update(teamInvitations)
        .set({
          usedAt: now,
          usedByUserId: data.userId,
        })
        .where(eq(teamInvitations.id, invitation.id)),
      db.insert(teamMembers).values({
        id: uuidv7(),
        teamId: invitation.teamId,
        userId: data.userId,
        role: "member",
        joinedAt: now,
      }),
    ]);

    return invitation;
  };

export const updateTeamSubscriptionStatus =
  (db: DB) =>
  async (teamId: string): Promise<void> => {
    const adminsWithSubscription = await db
      .select({ count: sql<number>`count(*)` })
      .from(teamMembers)
      .innerJoin(schema.users, eq(teamMembers.userId, schema.users.id))
      .innerJoin(subscriptions, eq(schema.users.id, subscriptions.userId))
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.role, "admin"),
          inArray(subscriptions.status, ["active", "complete"]),
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
  };

export const removeTeamMember =
  (db: DB) =>
  async (data: RemoveTeamMemberParams): Promise<void> => {
    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, data.userId),
        ),
      );

    await updateTeamSubscriptionStatus(db)(data.teamId);
  };

export const getActiveAdminCount =
  (db: DB) =>
  async (teamId: string): Promise<number> => {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(teamMembers)
      .innerJoin(schema.users, eq(teamMembers.userId, schema.users.id))
      .innerJoin(subscriptions, eq(schema.users.id, subscriptions.userId))
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.role, "admin"),
          inArray(subscriptions.status, ["active", "complete"]),
        ),
      )
      .get();

    return result?.count ?? 0;
  };

export const transferTeamOwnership =
  (db: DB) =>
  async (data: TransferTeamOwnershipParams): Promise<void> => {
    await db.batch([
      db
        .update(teamMembers)
        .set({ role: "member" })
        .where(
          and(
            eq(teamMembers.teamId, data.teamId),
            eq(teamMembers.userId, data.fromUserId),
          ),
        ),
      db
        .update(teamMembers)
        .set({ role: "admin" })
        .where(
          and(
            eq(teamMembers.teamId, data.teamId),
            eq(teamMembers.userId, data.toUserId),
          ),
        ),
    ]);
  };

export const deleteTeam =
  (db: DB) =>
  async (teamId: string): Promise<void> => {
    await db.delete(teams).where(eq(teams.id, teamId));
  };

export const getInvitationByToken =
  (db: DB) =>
  async (token: string): Promise<TeamInvitation | undefined> => {
    const now = new Date();
    return await db
      .select()
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.token, token),
          gt(teamInvitations.expiresAt, now),
          isNull(teamInvitations.usedAt),
        ),
      )
      .get();
  };

export const isUserTeamMember =
  (db: DB) =>
  async (userId: number, teamId: string): Promise<boolean> => {
    const membership = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
      )
      .get();

    return !!membership;
  };

// Re-export types from interface
export * from "./interface";
