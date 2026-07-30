CREATE TABLE `health_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`status` enum('HEALTHY','SURVEILLANCE','SICK','UNDER_TREATMENT','RECOVERED') NOT NULL DEFAULT 'HEALTHY',
	`symptoms` text,
	`diagnosis` text,
	`severity` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'LOW',
	`recorded_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treatments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`health_record_id` int NOT NULL,
	`medication_name` varchar(255) NOT NULL,
	`dosage` varchar(50) NOT NULL,
	`duration_days` int,
	`frequency` enum('ONCE_DAILY','TWICE_DAILY','THREE_TIMES_DAILY','WEEKLY','MONTHLY') NOT NULL,
	`route` enum('ORAL','INTRAMUSCULAR','INTRAVENOUS','SUBCUTANEOUS','TOPICAL') NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date,
	`next_dose_date` date,
	`administered` boolean DEFAULT false,
	`administered_at` timestamp,
	`administered_by` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treatments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vaccinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`vaccine_type` varchar(255) NOT NULL,
	`batch_number` varchar(50),
	`date` date NOT NULL,
	`booster_date` date,
	`status` enum('PENDING','DONE','OVERDUE') NOT NULL DEFAULT 'PENDING',
	`administered_by` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vaccinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `veterinary_interventions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`performed_by` int,
	`date` datetime NOT NULL,
	`type` enum('CHECKUP','SURGERY','OBSTETRICS','ULTRASOUND','TREATMENT','EMERGENCY') NOT NULL,
	`cost` decimal(10,2),
	`report` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `veterinary_interventions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `health_records` ADD CONSTRAINT `health_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_records` ADD CONSTRAINT `health_records_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `treatments` ADD CONSTRAINT `treatments_health_record_id_health_records_id_fk` FOREIGN KEY (`health_record_id`) REFERENCES `health_records`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `treatments` ADD CONSTRAINT `treatments_administered_by_users_id_fk` FOREIGN KEY (`administered_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vaccinations` ADD CONSTRAINT `vaccinations_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vaccinations` ADD CONSTRAINT `vaccinations_administered_by_users_id_fk` FOREIGN KEY (`administered_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `veterinary_interventions` ADD CONSTRAINT `veterinary_interventions_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `veterinary_interventions` ADD CONSTRAINT `veterinary_interventions_performed_by_users_id_fk` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;