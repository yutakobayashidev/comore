import { eq, and } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "@/database/schema";
import { userSubscriptions, teamSubscriptions, users, teams } from "@/database/schema";
import type {
  UserSubscription,
  TeamSubscription,
  UserSubscriptionWithTarget,
  TeamSubscriptionWithTarget,
  SubscriptionsResponse,
} from "./interface";

export const subscribeToUser =
  (db: DrizzleD1Database<typeof schema>) =>
  async (subscriberId: number, targetUserId: number): Promise<UserSubscription> => {
    // Check if already subscribed
    const existing = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.subscriberId, subscriberId),
          eq(userSubscriptions.targetUserId, targetUserId)
        )
      )
      .get();

    if (existing) {
      return existing;
    }

    // Cannot subscribe to self
    if (subscriberId === targetUserId) {
      throw new Error("Cannot subscribe to yourself");
    }

    // Check if target user exists
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .get();

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Create subscription
    const result = await db
      .insert(userSubscriptions)
      .values({
        subscriberId,
        targetUserId,
        createdAt: new Date(),
      })
      .returning()
      .get();

    return result;
  };

export const unsubscribeFromUser =
  (db: DrizzleD1Database<typeof schema>) =>
  async (subscriberId: number, targetUserId: number): Promise<void> => {
    const result = await db
      .delete(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.subscriberId, subscriberId),
          eq(userSubscriptions.targetUserId, targetUserId)
        )
      )
      .returning()
      .get();

    if (!result) {
      throw new Error("Subscription not found");
    }
  };

export const subscribeToTeam =
  (db: DrizzleD1Database<typeof schema>) =>
  async (subscriberId: number, targetTeamId: string): Promise<TeamSubscription> => {
    // Check if already subscribed
    const existing = await db
      .select()
      .from(teamSubscriptions)
      .where(
        and(
          eq(teamSubscriptions.subscriberId, subscriberId),
          eq(teamSubscriptions.targetTeamId, targetTeamId)
        )
      )
      .get();

    if (existing) {
      return existing;
    }

    // Check if target team exists
    const targetTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, targetTeamId))
      .get();

    if (!targetTeam) {
      throw new Error("Target team not found");
    }

    // Create subscription
    const result = await db
      .insert(teamSubscriptions)
      .values({
        subscriberId,
        targetTeamId,
        createdAt: new Date(),
      })
      .returning()
      .get();

    return result;
  };

export const unsubscribeFromTeam =
  (db: DrizzleD1Database<typeof schema>) =>
  async (subscriberId: number, targetTeamId: string): Promise<void> => {
    const result = await db
      .delete(teamSubscriptions)
      .where(
        and(
          eq(teamSubscriptions.subscriberId, subscriberId),
          eq(teamSubscriptions.targetTeamId, targetTeamId)
        )
      )
      .returning()
      .get();

    if (!result) {
      throw new Error("Subscription not found");
    }
  };

export const getUserSubscriptions =
  (db: DrizzleD1Database<typeof schema>) =>
  async (userId: number): Promise<SubscriptionsResponse> => {
    // Get user subscriptions with target user info
    const userSubs = await db
      .select({
        subscription: userSubscriptions,
        targetUser: {
          id: users.id,
          handle: users.handle,
        },
      })
      .from(userSubscriptions)
      .innerJoin(users, eq(userSubscriptions.targetUserId, users.id))
      .where(eq(userSubscriptions.subscriberId, userId));

    const userSubscriptionsWithTarget: UserSubscriptionWithTarget[] = userSubs.map(
      (row) => ({
        ...row.subscription,
        targetUser: row.targetUser,
      })
    );

    // Get team subscriptions with target team info
    const teamSubs = await db
      .select({
        subscription: teamSubscriptions,
        targetTeam: {
          id: teams.id,
          name: teams.name,
          slug: teams.slug,
        },
      })
      .from(teamSubscriptions)
      .innerJoin(teams, eq(teamSubscriptions.targetTeamId, teams.id))
      .where(eq(teamSubscriptions.subscriberId, userId));

    const teamSubscriptionsWithTarget: TeamSubscriptionWithTarget[] = teamSubs.map(
      (row) => ({
        ...row.subscription,
        targetTeam: row.targetTeam,
      })
    );

    return {
      userSubscriptions: userSubscriptionsWithTarget,
      teamSubscriptions: teamSubscriptionsWithTarget,
    };
  };

export const isSubscribedToUser =
  (db: DrizzleD1Database<typeof schema>) =>
  async (subscriberId: number, targetUserId: number): Promise<boolean> => {
    const result = await db
      .select({ id: userSubscriptions.id })
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.subscriberId, subscriberId),
          eq(userSubscriptions.targetUserId, targetUserId)
        )
      )
      .get();

    return !!result;
  };

export const isSubscribedToTeam =
  (db: DrizzleD1Database<typeof schema>) =>
  async (subscriberId: number, targetTeamId: string): Promise<boolean> => {
    const result = await db
      .select({ id: teamSubscriptions.id })
      .from(teamSubscriptions)
      .where(
        and(
          eq(teamSubscriptions.subscriberId, subscriberId),
          eq(teamSubscriptions.targetTeamId, targetTeamId)
        )
      )
      .get();

    return !!result;
  };