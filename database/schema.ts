import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";

// ユーザー
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" }),
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
