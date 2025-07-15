import { integer, text, sqliteTable, index } from "drizzle-orm/sqlite-core";

// Users
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey(),
    githubId: integer("github_id").notNull().unique(),
    email: text("email").notNull().unique(),
    handle: text("handle").notNull().unique(),
    stripeId: text("stripe_id").unique(),
  },
  (table) => ({
    githubIdIndex: index("github_id_index").on(table.githubId),
    handleIndex: index("handle_index").on(table.handle),
    stripeIdIndex: index("stripe_id_index").on(table.stripeId),
  }),
);

// Sessions
export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

// RSS Feeds
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

// Subscriptions
export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id").notNull().unique(),
    status: text("status").notNull(),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", {
      mode: "boolean",
    }).notNull(),
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

const schema = { users, sessions, feeds, userFeeds, subscriptions };

export default schema;
