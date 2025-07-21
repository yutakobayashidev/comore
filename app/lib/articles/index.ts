import { eq, inArray, desc, and, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "~/database/schema";
import {
  articles,
  feeds,
  userSubscriptions,
  teamSubscriptions,
  teamMembers,
  users,
} from "~/database/schema";
import type {
  Article,
  CreateArticleParams,
  ArticleWithFeed,
  GetTimelineParams,
  GetArticlesParams,
  ArticlesResponse,
} from "./interface";

const DEFAULT_PAGE_SIZE = 20;

export const createArticle =
  (db: DrizzleD1Database<typeof schema>) =>
  async (params: CreateArticleParams): Promise<Article> => {
    const now = new Date();
    const result = await db
      .insert(articles)
      .values({
        ...params,
        description: params.description || null,
        content: params.content || null,
        author: params.author || null,
        ogImageUrl: params.ogImageUrl || null,
        publishedAt: params.publishedAt || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return result;
  };

export const getArticlesByFeedIds =
  (db: DrizzleD1Database<typeof schema>) =>
  async (params: GetArticlesParams): Promise<ArticlesResponse> => {
    const { feedIds, page = 1, limit = DEFAULT_PAGE_SIZE } = params;
    const offset = (page - 1) * limit;

    if (feedIds.length === 0) {
      return { articles: [], hasMore: false, totalCount: 0 };
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(inArray(articles.feedId, feedIds))
      .get();

    const totalCount = countResult?.count || 0;

    // Get articles with feed info
    const results = await db
      .select({
        article: articles,
        feed: {
          id: feeds.id,
          title: feeds.title,
          userId: feeds.userId,
        },
      })
      .from(articles)
      .innerJoin(feeds, eq(articles.feedId, feeds.id))
      .where(inArray(articles.feedId, feedIds))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);

    const articlesWithFeed: ArticleWithFeed[] = results.map((row) => ({
      ...row.article,
      feed: row.feed,
    }));

    return {
      articles: articlesWithFeed,
      hasMore: offset + limit < totalCount,
      totalCount,
    };
  };

export const getTimelineArticles =
  (db: DrizzleD1Database<typeof schema>) =>
  async (params: GetTimelineParams): Promise<ArticlesResponse> => {
    const { userId, page = 1, limit = DEFAULT_PAGE_SIZE } = params;
    const offset = (page - 1) * limit;

    // Get all feed IDs from subscribed users and teams
    const subscribedUserFeeds = await db
      .select({ feedId: feeds.id })
      .from(userSubscriptions)
      .innerJoin(users, eq(userSubscriptions.targetUserId, users.id))
      .innerJoin(feeds, eq(feeds.userId, users.id))
      .where(eq(userSubscriptions.subscriberId, userId));

    const subscribedTeamFeeds = await db
      .select({ feedId: feeds.id })
      .from(teamSubscriptions)
      .innerJoin(
        teamMembers,
        eq(teamSubscriptions.targetTeamId, teamMembers.teamId),
      )
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .innerJoin(feeds, eq(feeds.userId, users.id))
      .where(eq(teamSubscriptions.subscriberId, userId));

    // Combine and deduplicate feed IDs
    const feedIds = Array.from(
      new Set([
        ...subscribedUserFeeds.map((f) => f.feedId),
        ...subscribedTeamFeeds.map((f) => f.feedId),
      ]),
    );

    if (feedIds.length === 0) {
      return { articles: [], hasMore: false, totalCount: 0 };
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(distinct ${articles.url})` })
      .from(articles)
      .where(inArray(articles.feedId, feedIds))
      .get();

    const totalCount = countResult?.count || 0;

    // Get unique articles with feed info
    const results = await db
      .selectDistinct({
        article: articles,
        feed: {
          id: feeds.id,
          title: feeds.title,
          userId: feeds.userId,
        },
      })
      .from(articles)
      .innerJoin(feeds, eq(articles.feedId, feeds.id))
      .where(inArray(articles.feedId, feedIds))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);

    const articlesWithFeed: ArticleWithFeed[] = results.map((row) => ({
      ...row.article,
      feed: row.feed,
    }));

    return {
      articles: articlesWithFeed,
      hasMore: offset + limit < totalCount,
      totalCount,
    };
  };

export const checkArticleExists =
  (db: DrizzleD1Database<typeof schema>) =>
  async (url: string): Promise<boolean> => {
    const result = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.url, url))
      .get();

    return !!result;
  };

export const getArticlesByUserId =
  (db: DrizzleD1Database<typeof schema>) =>
  async (
    userId: number,
    params: { page?: number; limit?: number },
  ): Promise<ArticlesResponse> => {
    const { page = 1, limit = DEFAULT_PAGE_SIZE } = params;
    const offset = (page - 1) * limit;

    // Get user's feed IDs
    const userFeeds = await db
      .select({ id: feeds.id })
      .from(feeds)
      .where(eq(feeds.userId, userId));

    const feedIds = userFeeds.map((f) => f.id);

    if (feedIds.length === 0) {
      return { articles: [], hasMore: false, totalCount: 0 };
    }

    return getArticlesByFeedIds(db)({ feedIds, page, limit });
  };

export const getArticlesByTeamId =
  (db: DrizzleD1Database<typeof schema>) =>
  async (
    teamId: string,
    params: { page?: number; limit?: number },
  ): Promise<ArticlesResponse> => {
    const { page = 1, limit = DEFAULT_PAGE_SIZE } = params;
    const offset = (page - 1) * limit;

    // Get team members' feed IDs
    const teamFeeds = await db
      .select({ feedId: feeds.id })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .innerJoin(feeds, eq(feeds.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    const feedIds = teamFeeds.map((f) => f.feedId);

    if (feedIds.length === 0) {
      return { articles: [], hasMore: false, totalCount: 0 };
    }

    return getArticlesByFeedIds(db)({ feedIds, page, limit });
  };

export const deleteArticlesByFeedId =
  (db: DrizzleD1Database<typeof schema>) =>
  async (feedId: number): Promise<void> => {
    await db.delete(articles).where(eq(articles.feedId, feedId));
  };
