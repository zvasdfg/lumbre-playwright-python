CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`product_category` text NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_items_order_index` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`delivery_notes` text,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`total` integer NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`paid_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_user_idempotency_unique` ON `orders` (`user_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `orders_user_created_index` ON `orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `payment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`adapter` text DEFAULT 'local_fake' NOT NULL,
	`outcome` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_attempts_order_idempotency_unique` ON `payment_attempts` (`order_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `payment_attempts_order_index` ON `payment_attempts` (`order_id`);