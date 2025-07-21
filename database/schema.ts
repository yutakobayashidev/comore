import {
  integer,
  text,
  sqliteTable,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Users
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey(),
    githubId: integer("github_id").notNull().unique(),
    email: text("email").notNull().unique(),
    handle: text("handle").notNull().unique(),
    stripeId: text("stripe_id").unique(),
    websiteUrl: text("website_url"),
    twitterUsername: text("twitter_username"),
    blueskyAddress: text("bluesky_address"),
    activityPubAddress: text("activitypub_address"),
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

// Teams
export const teams = sqliteTable(
  "teams",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    hasActiveSubscription: integer("has_active_subscription", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    slugIndex: index("team_slug_index").on(table.slug),
  }),
);

// Team Members
export const teamMembers = sqliteTable(
  "team_members",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "member"] }).notNull(),
    joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    teamIdIndex: index("team_member_team_id_index").on(table.teamId),
    userIdIndex: index("team_member_user_id_index").on(table.userId),
    uniqueTeamUser: uniqueIndex("unique_team_user").on(
      table.teamId,
      table.userId,
    ),
  }),
);

// Team Invitations
export const teamInvitations = sqliteTable(
  "team_invitations",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    invitedByUserId: integer("invited_by_user_id")
      .notNull()
      .references(() => users.id),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp" }),
    usedByUserId: integer("used_by_user_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    tokenIndex: index("team_invitation_token_index").on(table.token),
    teamIdIndex: index("team_invitation_team_id_index").on(table.teamId),
  }),
);

// Feeds
export const feeds = sqliteTable(
  "feeds",
  {
    id: integer("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    lastFetchedAt: integer("last_fetched_at", { mode: "timestamp" }),
    lastErrorAt: integer("last_error_at", { mode: "timestamp" }),
    lastErrorMessage: text("last_error_message"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIndex: index("feed_user_id_index").on(table.userId),
    isActiveIndex: index("feed_is_active_index").on(table.isActive),
    uniqueUserUrl: uniqueIndex("unique_user_url").on(table.userId, table.url),
  }),
);

// Articles
export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey(),
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    description: text("description"),
    content: text("content"),
    author: text("author"),
    ogImageUrl: text("og_image_url"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    feedIdPublishedAtIndex: index("article_feed_id_published_at_index").on(
      table.feedId,
      table.publishedAt,
    ),
    publishedAtIndex: index("article_published_at_index").on(table.publishedAt),
    urlIndex: uniqueIndex("article_url_index").on(table.url),
  }),
);

// User Subscriptions
export const userSubscriptions = sqliteTable(
  "user_subscriptions",
  {
    id: integer("id").primaryKey(),
    subscriberId: integer("subscriber_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: integer("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    subscriberIdIndex: index("user_subscription_subscriber_id_index").on(
      table.subscriberId,
    ),
    uniqueSubscriberTarget: uniqueIndex("unique_subscriber_target_user").on(
      table.subscriberId,
      table.targetUserId,
    ),
  }),
);

// Team Subscriptions
export const teamSubscriptions = sqliteTable(
  "team_subscriptions",
  {
    id: integer("id").primaryKey(),
    subscriberId: integer("subscriber_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetTeamId: text("target_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    subscriberIdIndex: index("team_subscription_subscriber_id_index").on(
      table.subscriberId,
    ),
    uniqueSubscriberTarget: uniqueIndex("unique_subscriber_target_team").on(
      table.subscriberId,
      table.targetTeamId,
    ),
  }),
);

const schema = {
  users,
  sessions,
  subscriptions,
  teams,
  teamMembers,
  teamInvitations,
  feeds,
  articles,
  userSubscriptions,
  teamSubscriptions,
};
export default schema;
