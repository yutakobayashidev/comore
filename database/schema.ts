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
    }).notNull().default(true),
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
    uniqueTeamUser: index("unique_team_user").on(table.teamId, table.userId),
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

const schema = { users, sessions, feeds, subscriptions };
export default schema;
