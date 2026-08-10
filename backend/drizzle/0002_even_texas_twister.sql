CREATE TABLE `user_exploitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`exploitation_id` int NOT NULL,
	`role` enum('OWNER','MANAGER','EMPLOYEE','VET') NOT NULL DEFAULT 'EMPLOYEE',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_exploitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD `expected_lambing_date` date;--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD `ultrasound_notes` text;--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD `lambing_date` date;--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD `lambing_type` varchar(10);--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD `live_born` int;--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD `still_born` int;--> statement-breakpoint
ALTER TABLE `user_exploitations` ADD CONSTRAINT `user_exploitations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_exploitations` ADD CONSTRAINT `user_exploitations_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;