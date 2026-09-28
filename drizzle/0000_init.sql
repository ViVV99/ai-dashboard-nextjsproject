CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` integer NOT NULL,
	`action` text NOT NULL,
	`target_id` integer,
	`metadata` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`city` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_items_quantity_check" CHECK("order_items"."quantity" > 0),
	CONSTRAINT "order_items_price_check" CHECK("order_items"."unit_price_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_id_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`status` text NOT NULL,
	`total_cents` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "orders_status_check" CHECK("orders"."status" IN ('paid', 'canceled', 'refunded')),
	CONSTRAINT "orders_total_check" CHECK("orders"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `page_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`product_id` integer,
	`source` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "page_views_source_check" CHECK("page_views"."source" IN ('direct', 'organic', 'social', 'ads', 'email'))
);
--> statement-breakpoint
CREATE INDEX `page_views_created_at_idx` ON `page_views` (`created_at`);--> statement-breakpoint
CREATE INDEX `page_views_source_idx` ON `page_views` (`source`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`price_cents` integer NOT NULL,
	`cost_cents` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "products_price_check" CHECK("products"."price_cents" >= 0),
	CONSTRAINT "products_cost_check" CHECK("products"."cost_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`supplier` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "purchases_quantity_check" CHECK("purchases"."quantity" > 0),
	CONSTRAINT "purchases_cost_check" CHECK("purchases"."unit_cost_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `purchases_created_at_idx` ON `purchases` (`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`session_version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "users_role_check" CHECK("users"."role" IN ('admin', 'viewer')),
	CONSTRAINT "users_status_check" CHECK("users"."status" IN ('active', 'blocked')),
	CONSTRAINT "users_name_length_check" CHECK(length("users"."name") BETWEEN 2 AND 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);