DROP INDEX `page_views_created_at_idx`;--> statement-breakpoint
CREATE INDEX `page_views_created_at_session_idx` ON `page_views` (`created_at`,`session_id`);