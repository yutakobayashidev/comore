import { eq, and, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "@/database/schema";
import { feeds } from "@/database/schema";
import type { Feed, CreateFeedParams, UpdateFeedParams, FeedError } from "./interface";
import { hasActiveSubscription } from "@/lib/teams";

const FREE_USER_FEED_LIMIT = 5;
const PAID_USER_FEED_LIMIT = 50;

export const createFeed =
  (db: DrizzleD1Database<typeof schema>) =>
  async (params: CreateFeedParams): Promise<Feed> => {
    const { userId, url, title, description } = params;

    // Check if user has active subscription
    const hasSubscription = await hasActiveSubscription(db)(userId);
    const feedLimit = hasSubscription ? PAID_USER_FEED_LIMIT : FREE_USER_FEED_LIMIT;

    // Check current feed count
    const feedCount = await getFeedCount(db)(userId);
    if (feedCount >= feedLimit) {
      const error = new Error(`Feed limit exceeded. Maximum ${feedLimit} feeds allowed.`) as FeedError;
      error.code = "FEED_LIMIT_EXCEEDED";
      throw error;
    }

    // Check if feed URL already exists for this user
    const existingFeed = await db
      .select()
      .from(feeds)
      .where(and(eq(feeds.userId, userId), eq(feeds.url, url)))
      .get();

    if (existingFeed) {
      const error = new Error("Feed URL already exists for this user") as FeedError;
      error.code = "FEED_ALREADY_EXISTS";
      throw error;
    }

    // Validate feed URL (basic check)
    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      const error = new Error("Invalid feed URL") as FeedError;
      error.code = "INVALID_FEED_URL";
      throw error;
    }

    // Create feed
    const now = new Date();
    const result = await db
      .insert(feeds)
      .values({
        userId,
        url,
        title: title || url,
        description: description || null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return result;
  };

export const getUserFeeds =
  (db: DrizzleD1Database<typeof schema>) =>
  async (userId: number): Promise<Feed[]> => {
    const result = await db
      .select()
      .from(feeds)
      .where(eq(feeds.userId, userId))
      .orderBy(feeds.createdAt);

    return result;
  };

export const updateFeed =
  (db: DrizzleD1Database<typeof schema>) =>
  async (params: UpdateFeedParams): Promise<Feed> => {
    const { id, userId, ...updateData } = params;

    // Verify ownership
    const feed = await db
      .select()
      .from(feeds)
      .where(and(eq(feeds.id, id), eq(feeds.userId, userId)))
      .get();

    if (!feed) {
      throw new Error("Feed not found or access denied");
    }

    // If URL is being updated, check if it already exists
    if (updateData.url) {
      const existingFeed = await db
        .select()
        .from(feeds)
        .where(
          and(
            eq(feeds.userId, userId),
            eq(feeds.url, updateData.url),
            sql`${feeds.id} != ${id}`
          )
        )
        .get();

      if (existingFeed) {
        const error = new Error("Feed URL already exists for this user") as FeedError;
        error.code = "FEED_ALREADY_EXISTS";
        throw error;
      }
    }

    // Update feed
    const result = await db
      .update(feeds)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(feeds.id, id), eq(feeds.userId, userId)))
      .returning()
      .get();

    if (!result) {
      throw new Error("Failed to update feed");
    }

    return result;
  };

export const deleteFeed =
  (db: DrizzleD1Database<typeof schema>) =>
  async (id: number, userId: number): Promise<void> => {
    const result = await db
      .delete(feeds)
      .where(and(eq(feeds.id, id), eq(feeds.userId, userId)))
      .returning()
      .get();

    if (!result) {
      throw new Error("Feed not found or access denied");
    }
  };

export const getFeedCount =
  (db: DrizzleD1Database<typeof schema>) =>
  async (userId: number): Promise<number> => {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(feeds)
      .where(eq(feeds.userId, userId))
      .get();

    return result?.count || 0;
  };

export const getFeedById =
  (db: DrizzleD1Database<typeof schema>) =>
  async (id: number): Promise<Feed | undefined> => {
    const result = await db
      .select()
      .from(feeds)
      .where(eq(feeds.id, id))
      .get();

    return result;
  };

export const getActiveFeeds =
  (db: DrizzleD1Database<typeof schema>) =>
  async (): Promise<Feed[]> => {
    const result = await db
      .select()
      .from(feeds)
      .where(eq(feeds.isActive, true));

    return result;
  };

export const updateFeedFetchStatus =
  (db: DrizzleD1Database<typeof schema>) =>
  async (id: number, error?: { message: string }): Promise<void> => {
    const now = new Date();
    
    if (error) {
      await db
        .update(feeds)
        .set({
          lastFetchedAt: now,
          lastErrorAt: now,
          lastErrorMessage: error.message,
          updatedAt: now,
        })
        .where(eq(feeds.id, id));
    } else {
      await db
        .update(feeds)
        .set({
          lastFetchedAt: now,
          lastErrorAt: null,
          lastErrorMessage: null,
          updatedAt: now,
        })
        .where(eq(feeds.id, id));
    }
  };