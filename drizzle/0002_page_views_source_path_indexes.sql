DROP INDEX `page_views_source_idx`;--> statement-breakpoint
CREATE INDEX `page_views_source_created_at_idx` ON `page_views` (`source`,`created_at`);--> statement-breakpoint
CREATE INDEX `page_views_path_idx` ON `page_views` (`path`,`created_at`,`product_id`);