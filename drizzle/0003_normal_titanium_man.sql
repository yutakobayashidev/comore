PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`github_id` integer NOT NULL,
	`email` text NOT NULL,
	`handle` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "github_id", "email", "handle") SELECT "id", "github_id", "email", "handle" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_github_id_unique` ON `users` (`github_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_unique` ON `users` (`handle`);--> statement-breakpoint
CREATE INDEX `github_id_index` ON `users` (`github_id`);--> statement-breakpoint
CREATE INDEX `handle_index` ON `users` (`handle`);