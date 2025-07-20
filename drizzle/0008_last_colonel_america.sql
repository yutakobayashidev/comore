DROP INDEX `unique_team_user`;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_team_user` ON `team_members` (`team_id`,`user_id`);