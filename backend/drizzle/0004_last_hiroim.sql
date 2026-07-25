CREATE TABLE `animals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfid` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`breed` enum('Sardi','Timahdite','D''man','Beni-Guil') NOT NULL,
	`sex` enum('MALE','FEMALE') NOT NULL,
	`birth_date` date,
	`father_id` int,
	`mother_id` int,
	`weight` decimal(6,2),
	`bcs` decimal(3,1),
	`health_status` enum('HEALTHY','SICK','RECOVERING','DECEASED','QUARANTINE') NOT NULL DEFAULT 'HEALTHY',
	`exploitation_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `animals_id` PRIMARY KEY(`id`),
	CONSTRAINT `animals_rfid_unique` UNIQUE(`rfid`)
);
--> statement-breakpoint
DROP TABLE `teams`;--> statement-breakpoint
ALTER TABLE `users` DROP FOREIGN KEY `users_exploitation_id_exploitations_id_fk`;
--> statement-breakpoint
ALTER TABLE `animals` ADD CONSTRAINT `animals_father_id_animals_id_fk` FOREIGN KEY (`father_id`) REFERENCES `animals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animals` ADD CONSTRAINT `animals_mother_id_animals_id_fk` FOREIGN KEY (`mother_id`) REFERENCES `animals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animals` ADD CONSTRAINT `animals_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `exploitation_id`;