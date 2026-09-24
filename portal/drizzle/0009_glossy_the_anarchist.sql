CREATE TABLE `administrative_audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`action` text NOT NULL,
	`before_json` text,
	`after_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `administrative_audit_resource_index` ON `administrative_audit_events` (`resource_type`,`resource_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `administrative_audit_actor_index` ON `administrative_audit_events` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `catalog_events` (
	`id` integer PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`month` text NOT NULL,
	`city` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`capacity` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_products` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`badge` text,
	`active` integer DEFAULT true NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `catalog_products` (`id`, `name`, `category`, `price`, `badge`) VALUES
	(101, 'Pinzas Forja 45', 'herramientas', 740, 'Favorito'),
	(102, 'Mandil Lumbre 01', 'ropa', 1290, NULL),
	(103, 'Gorra Brasa Baja', 'outdoor', 590, 'Nuevo'),
	(104, 'Playera Después del Humo', 'ropa', 680, NULL),
	(111, 'Blend LHC-003 · SPG clásico', 'blends', 260, 'Esencial'),
	(112, 'Blend LHP-007 · Pollo ahumado', 'blends', 290, 'Sumac + orégano'),
	(113, 'Blend LHV-002 · Umami tostado', 'blends', 310, 'Sésamo + shiitake');
--> statement-breakpoint
INSERT INTO `catalog_events` (`id`, `day`, `month`, `city`, `title`, `detail`, `capacity`) VALUES
	(201, '18', 'JUL', 'Monterrey, NL', 'Fuego de montaña', 'Taller de cortes y control de temperatura', 8),
	(202, '09', 'AGO', 'Valle de Bravo, MEX', 'Mesa entre pinos', 'Cena colaborativa de cinco tiempos', 12),
	(203, '30', 'AGO', 'Querétaro, QRO', 'Humo y fermentos', 'Clase de ahumado y salsas vivas', 5);
