CREATE TABLE `user_dashboard_widgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`widget_type` enum('kpi-herd','gmq-trend','breed-distribution','financial','alerts') NOT NULL,
	`is_visible` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_dashboard_widgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_dashboard_widgets` ADD CONSTRAINT `user_dashboard_widgets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;