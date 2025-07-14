import { eq } from "drizzle-orm";
import schema, { sessions, users } from "../../../../database/schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { parseCookies } from "~/utils/cookies";
import type { Session, SessionValidationResult } from "./interface";
import type { User } from "../user/interface";

export const validateSessionToken =
  (db: DrizzleD1Database<typeof schema>) =>
  async (token: string): Promise<SessionValidationResult> => {
    const sessionId = encodeHexLowerCase(
      sha256(new TextEncoder().encode(token)),
    );

    const result = await db
      .select({
        sessionId: sessions.id,
        sessionUserId: sessions.userId,
        sessionExpiresAt: sessions.expiresAt,
        userId: users.id,
        userGithubId: users.githubId,
        userEmail: users.email,
        userHandle: users.handle,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .limit(1);

    const row = result[0];

    if (result.length === 0 || !row) {
      return { session: null, user: null };
    }

    const session: Session = {
      id: row.sessionId,
      userId: row.sessionUserId,
      expiresAt: new Date(row.sessionExpiresAt * 1000),
    };
    const user: User = {
      id: row.userId,
      githubId: row.userGithubId,
      email: row.userEmail,
      handle: row.userHandle,
    };

    if (Date.now() >= session.expiresAt.getTime()) {
      await db.delete(sessions).where(eq(sessions.id, session.id));
      return { session: null, user: null };
    }

    if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
      session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
      await db
        .update(sessions)
        .set({ expiresAt: Math.floor(session.expiresAt.getTime() / 1000) })
        .where(eq(sessions.id, session.id));
    }

    return { session, user };
  };

export const invalidateSession =
  (db: DrizzleD1Database<typeof schema>) =>
  async (sessionId: string): Promise<void> => {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  };

export const invalidateUserSessions =
  (db: DrizzleD1Database<typeof schema>) =>
  async (userId: number): Promise<void> => {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  };

export function generateSessionToken(): string {
  const tokenBytes = new Uint8Array(20);
  crypto.getRandomValues(tokenBytes);
  const token = encodeBase32LowerCaseNoPadding(tokenBytes);
  return token;
}

export const createSession =
  (db: DrizzleD1Database<typeof schema>) =>
  async (token: string, userId: number): Promise<Session> => {
    const sessionId = encodeHexLowerCase(
      sha256(new TextEncoder().encode(token)),
    );
    const session: Session = {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    };

    await db.insert(sessions).values({
      id: session.id,
      userId: session.userId,
      expiresAt: Math.floor(session.expiresAt.getTime() / 1000),
    });

    return session;
  };

export function setSessionTokenCookie(token: string, expiresAt: Date): string {
  return `session=${token}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/; Secure`;
}

export function deleteSessionTokenCookie(): string {
  return `session=; HttpOnly; SameSite=Lax; MaxAge=0; Path=/; Secure`;
}

export const getCurrentSession =
  (db: DrizzleD1Database<typeof schema>) =>
  async (request: Request): Promise<SessionValidationResult> => {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) {
      return { session: null, user: null };
    }

    const cookies = parseCookies(cookieHeader);
    const token = cookies["session"] || null;

    if (token === null) {
      return { session: null, user: null };
    }

    const result = await validateSessionToken(db)(token);
    return result;
  };
