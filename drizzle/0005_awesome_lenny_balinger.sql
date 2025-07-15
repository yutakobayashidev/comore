ALTER TABLE `users` ADD `stripe_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_stripe_id_unique` ON `users` (`stripe_id`);--> statement-breakpoint
CREATE INDEX `stripe_id_index` ON `users` (`stripe_id`);