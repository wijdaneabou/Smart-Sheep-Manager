CREATE TABLE `mating_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`cycle_id` int,
	`service_date` date NOT NULL,
	`type` varchar(20) NOT NULL,
	`male_id` int,
	`semen_reference` varchar(100),
	`service_number` int NOT NULL DEFAULT 1,
	`result` varchar(20) DEFAULT 'pending',
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mating_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mating_services` ADD CONSTRAINT `mating_services_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mating_services` ADD CONSTRAINT `mating_services_cycle_id_reproduction_cycles_id_fk` FOREIGN KEY (`cycle_id`) REFERENCES `reproduction_cycles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mating_services` ADD CONSTRAINT `mating_services_male_id_animals_id_fk` FOREIGN KEY (`male_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mating_services` ADD CONSTRAINT `mating_services_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mating_animal_idx` ON `mating_services` (`animal_id`);--> statement-breakpoint
CREATE INDEX `mating_cycle_idx` ON `mating_services` (`cycle_id`);--> statement-breakpoint
CREATE INDEX `mating_date_idx` ON `mating_services` (`service_date`);