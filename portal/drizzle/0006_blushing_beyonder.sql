CREATE TABLE `event_reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_id` integer NOT NULL,
	`event_title` text NOT NULL,
	`event_city` text NOT NULL,
	`event_day` text NOT NULL,
	`event_month` text NOT NULL,
	`party_size` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_reservations_event_user_unique` ON `event_reservations` (`event_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `event_reservations_user_created_index` ON `event_reservations` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `event_reservations_event_status_index` ON `event_reservations` (`event_id`,`status`);