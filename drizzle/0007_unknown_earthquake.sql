CREATE TABLE `team_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`invited_by_user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`used_by_user_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`used_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_invitations_token_unique` ON `team_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `team_invitation_token_index` ON `team_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `team_invitation_team_id_index` ON `team_invitations` (`team_id`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_member_team_id_index` ON `team_members` (`team_id`);--> statement-breakpoint
CREATE INDEX `team_member_user_id_index` ON `team_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `unique_team_user` ON `team_members` (`team_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`has_active_subscription` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_slug_unique` ON `teams` (`slug`);--> statement-breakpoint
CREATE INDEX `team_slug_index` ON `teams` (`slug`);