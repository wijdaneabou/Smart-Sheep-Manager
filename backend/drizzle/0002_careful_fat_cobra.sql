ALTER TABLE `users` ADD `exploitation_id` int;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;

CREATE TABLE `exploitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `exploitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `login_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`ip` varchar(45),
	`user_agent` varchar(255),
	`success` boolean NOT NULL DEFAULT true,
	`login_at` timestamp DEFAULT (now()),
	CONSTRAINT `login_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `login_history` ADD CONSTRAINT `login_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
