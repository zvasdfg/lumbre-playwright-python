ALTER TABLE `catalog_products` ADD `stock` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `catalog_products` SET `stock` = CASE `id`
	WHEN 101 THEN 12
	WHEN 102 THEN 8
	WHEN 103 THEN 18
	WHEN 104 THEN 16
	WHEN 111 THEN 40
	WHEN 112 THEN 32
	WHEN 113 THEN 28
	ELSE 0
END;--> statement-breakpoint
ALTER TABLE `orders` ADD `inventory_state` text DEFAULT 'uncommitted' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `inventory_key` text;
