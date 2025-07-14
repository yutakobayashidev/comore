CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_subscription_id_unique` ON `subscriptions` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `subscription_id_index` ON `subscriptions` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `user_id_index` ON `subscriptions` (`user_id`);