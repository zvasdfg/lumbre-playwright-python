ALTER TABLE `orders` ADD `fulfillment_status` text DEFAULT 'unfulfilled' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancellation_key` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelled_at` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `fulfilled_at` text;