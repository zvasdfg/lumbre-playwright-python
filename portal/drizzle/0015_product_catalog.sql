INSERT INTO `catalog_products` (`id`, `name`, `category`, `price`, `stock`, `badge`, `active`)
VALUES
  (121, 'Sazonador multiuso', 'blends', 0, 0, 'Producción', 1),
  (122, 'Sazonador para carne de res', 'blends', 0, 0, 'Producción', 1),
  (123, 'Sazonador para carne de cerdo', 'blends', 0, 0, 'Producción', 1),
  (124, 'Sazonador para carne de pollo', 'blends', 0, 0, 'Producción', 1)
ON CONFLICT(`id`) DO NOTHING;
--> statement-breakpoint
INSERT INTO `system_metadata` (`key`, `value`, `updated_at`)
VALUES ('seed_version', '2026.09.30', CURRENT_TIMESTAMP)
ON CONFLICT(`key`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = CURRENT_TIMESTAMP;
