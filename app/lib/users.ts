import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import schema from "~/database/schema";

type DB = DrizzleD1Database<typeof schema>;

export const getUserById = (db: DB) => async (userId: number) => {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  return user;
};

export const updateUserSocialLinks = (db: DB) => async ({
  userId,
  websiteUrl,
  twitterUsername,
  blueskyAddress,
  activityPubAddress,
}: {
  userId: number;
  websiteUrl: string | null;
  twitterUsername: string | null;
  blueskyAddress: string | null;
  activityPubAddress: string | null;
}) => {
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