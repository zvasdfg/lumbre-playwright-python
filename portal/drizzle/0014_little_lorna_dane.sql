CREATE TABLE `user_blends` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`signature` text NOT NULL,
	`title` text NOT NULL,
	`objective` text NOT NULL,
	`record_json` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`moderation_note` text,
	`published_hypothesis_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`submitted_at` text,
	`published_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`published_hypothesis_id`) REFERENCES `hypotheses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_blends_user_signature_unique` ON `user_blends` (`user_id`,`signature`);--> statement-breakpoint
CREATE INDEX `user_blends_user_updated_index` ON `user_blends` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `user_blends_status_updated_index` ON `user_blends` (`status`,`updated_at`);