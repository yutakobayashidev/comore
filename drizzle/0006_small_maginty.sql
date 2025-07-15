PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` integer,
	`cancel_at_period_end` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_subscriptions`("id", "subscription_id", "status", "current_period_end", "cancel_at_period_end", "created_at", "updated_at", "user_id") SELECT "id", "subscription_id", "status", "current_period_end", "cancel_at_period_end", "created_at", "updated_at", "user_id" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_subscription_id_unique` ON `subscriptions` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `subscription_id_index` ON `subscriptions` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `user_id_index` ON `subscriptions` (`user_id`);