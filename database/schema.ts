import { integer, text, sqliteTable, index } from "drizzle-orm/sqlite-core";

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

const schema = { users, sessions, feeds };
export default schema;
