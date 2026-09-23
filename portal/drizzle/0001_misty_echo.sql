CREATE TABLE `hypotheses` (
	`id` text PRIMARY KEY NOT NULL,
	`signature` text NOT NULL,
	`objective` text NOT NULL,
	`record_json` text NOT NULL,
	`duplicate_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hypotheses_signature_unique` ON `hypotheses` (`signature`);