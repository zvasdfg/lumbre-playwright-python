CREATE TABLE `hosted_checkout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`provider` text NOT NULL,
	`provider_session_id` text NOT NULL,
	`checkout_url` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hosted_checkout_order_idempotency_unique` ON `hosted_checkout_sessions` (`order_id`,`idempotency_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `hosted_checkout_provider_session_unique` ON `hosted_checkout_sessions` (`provider`,`provider_session_id`);--> statement-breakpoint
CREATE TABLE `payment_provider_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`event_type` text NOT NULL,
	`provider_object_id` text NOT NULL,
	`order_id` text NOT NULL,
	`payload_hash` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`error` text,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`processed_at` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payment_provider_events_order_index` ON `payment_provider_events` (`order_id`);--> statement-breakpoint
CREATE INDEX `payment_provider_events_status_index` ON `payment_provider_events` (`status`);