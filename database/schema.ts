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

// ユーザーのフィード
export const userFeeds = sqliteTable(
  "user_feeds",
  {
    id: integer("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    feedId: text("feed_id")
      .notNull()
      .references(() => feeds.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIndex: index("user_id_index").on(table.userId),
    feedIdIndex: index("feed_id_index").on(table.feedId),
    uniqueUserFeed: index("unique_user_feed").on(table.userId, table.feedId),
  }),
);

const schema = { users, sessions, feeds, userFeeds };
export default schema;
