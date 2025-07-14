import { eq } from "drizzle-orm";
import schema, { users } from "../../../../database/schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { User, CreateUserParams } from "./interface";

export const getUserFromGitHubId =
  (db: DrizzleD1Database<typeof schema>) =>
  async (githubId: number): Promise<User | null> => {
    const result = await db.query.users.findFirst({
      where: eq(users.githubId, githubId),
    });

    return result ? result : null;
  };

export const createUser =
  (db: DrizzleD1Database<typeof schema>) =>
  async (params: CreateUserParams): Promise<User> => {
    const result = await db.insert(users).values(params).returning();
    const user = result[0];

    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  };
