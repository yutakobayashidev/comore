import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import schema from "~/database/schema";
import type { User, UpdateUserSocialLinksParams } from "./interface";

type DB = DrizzleD1Database<typeof schema>;

export const getUserById =
  (db: DB) =>
  async (userId: number): Promise<User | undefined> => {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    return user;
  };

export const updateUserSocialLinks =
  (db: DB) =>
  async ({
    userId,
    websiteUrl,
    twitterUsername,
    blueskyAddress,
    activityPubAddress,
  }: UpdateUserSocialLinksParams): Promise<void> => {
    await db
      .update(schema.users)
      .set({
        websiteUrl,
        twitterUsername,
        blueskyAddress,
        activityPubAddress,
      })
      .where(eq(schema.users.id, userId));
  };

// Re-export types from interface
export * from "./interface";