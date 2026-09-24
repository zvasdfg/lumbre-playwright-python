CREATE TABLE `fire_planner_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`guests` integer NOT NULL,
	`cooking_style` text NOT NULL,
	`duration_hours` integer NOT NULL,
	`fuel_type` text NOT NULL,
	`equipment` text NOT NULL,
	`weather` text NOT NULL,
	`serving_time` text NOT NULL,
	`include_vegetables` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fire_planner_presets_user_name_unique` ON `fire_planner_presets` (`user_id`,`normalized_name`);--> statement-breakpoint
CREATE INDEX `fire_planner_presets_user_updated_index` ON `fire_planner_presets` (`user_id`,`updated_at`);