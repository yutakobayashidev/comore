CREATE TABLE `articles` (
	`id` integer PRIMARY KEY NOT NULL,
	`feed_id` integer NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`content` text,
	`author` text,
	`og_image_url` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_url_unique` ON `articles` (`url`);--> statement-breakpoint
CREATE INDEX `article_feed_id_published_at_index` ON `articles` (`feed_id`,`published_at`);--> statement-breakpoint
CREATE INDEX `article_published_at_index` ON `articles` (`published_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `article_url_index` ON `articles` (`url`);--> statement-breakpoint
CREATE TABLE `feeds` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_fetched_at` integer,
	`last_error_at` integer,
	`last_error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feed_user_id_index` ON `feeds` (`user_id`);--> statement-breakpoint
CREATE INDEX `feed_is_active_index` ON `feeds` (`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_url` ON `feeds` (`user_id`,`url`);--> statement-breakpoint
CREATE TABLE `team_subscriptions` (
	`id` integer PRIMARY KEY NOT NULL,
	`subscriber_id` integer NOT NULL,
	`target_team_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subscriber_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_subscription_subscriber_id_index` ON `team_subscriptions` (`subscriber_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_subscriber_target_team` ON `team_subscriptions` (`subscriber_id`,`target_team_id`);--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` integer PRIMARY KEY NOT NULL,
	`subscriber_id` integer NOT NULL,
	`target_user_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subscriber_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_subscription_subscriber_id_index` ON `user_subscriptions` (`subscriber_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_subscriber_target_user` ON `user_subscriptions` (`subscriber_id`,`target_user_id`);