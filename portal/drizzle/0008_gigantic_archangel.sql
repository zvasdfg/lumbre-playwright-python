CREATE TABLE `membership_consent_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`channel` text NOT NULL,
	`granted` integer NOT NULL,
	`recorded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `membership_consent_user_recorded_index` ON `membership_consent_events` (`user_id`,`recorded_at`);--> statement-breakpoint
CREATE TABLE `membership_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`preferred_fuel` text NOT NULL,
	`equipment` text NOT NULL,
	`cooking_style` text NOT NULL,
	`default_guests` integer NOT NULL,
	`newsletter_consent` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
