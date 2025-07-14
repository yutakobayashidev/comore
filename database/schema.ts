import { integer, text, sqliteTable, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ユーザー
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey(),
    githubId: integer("github_id").notNull().unique(),
    email: text("email").notNull().unique(),
    handle: text("handle").notNull().unique(),
  },
  (table) => ({
    githubIdIndex: index("github_id_index").on(table.githubId),
    handleIndex: index("handle_index").on(table.handle),
  }),
);

// セッション
export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

// RSSフィード
export const feeds = sqliteTable("feeds", {
  id: text("id").primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title"),
  description: text("description"),
  faviconUrl: text("favicon_url"),
  homepageUrl: text("homepage_url"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// サブスクリプション
export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id").notNull().unique(),
    status: text("status").notNull(),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    subscriptionIdIndex: index("subscription_id_index").on(
      table.subscriptionId,
    ),
    userIdIndex: index("user_id_index").on(table.userId),
  }),
);

const schema = { users, sessions, feeds, subscriptions };
export default schema;
