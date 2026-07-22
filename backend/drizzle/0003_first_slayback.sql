ALTER TABLE `exploitations` ADD `superficie` decimal(10,2);--> statement-breakpoint
ALTER TABLE `exploitations` ADD `latitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `exploitations` ADD `longitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `exploitations` ADD `photo` varchar(255);--> statement-breakpoint
ALTER TABLE `exploitations` ADD `type` enum('OVIN','CAPRIN','MIXTE') DEFAULT 'OVIN' NOT NULL;--> statement-breakpoint
ALTER TABLE `exploitations` ADD `owner_id` int;--> statement-breakpoint
ALTER TABLE `exploitations` ADD CONSTRAINT `exploitations_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;