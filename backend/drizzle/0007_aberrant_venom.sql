CREATE TABLE `animal_health_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`category` enum('HEALTH_CHECK','TREATMENT','VACCINATION','ILLNESS') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`veterinarian` varchar(100),
	`medication` varchar(200),
	`dosage` varchar(100),
	`date` date NOT NULL,
	`status` enum('COMPLETED','ONGOING','RECOVERING') DEFAULT 'COMPLETED',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `animal_health_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `animal_reproduction_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`event_type` enum('BREEDING','PREGNANCY_CHECK','BIRTH','WEANING') NOT NULL,
	`date` date NOT NULL,
	`partner_id` int,
	`result` varchar(200),
	`note` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `animal_reproduction_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `animal_weight_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`weight` decimal(6,2) NOT NULL,
	`bcs` decimal(3,1),
	`date` date NOT NULL,
	`note` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `animal_weight_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `animal_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`type` enum('ENTRY','EXIT','DEATH','SALE','PURCHASE') NOT NULL,
	`date` date NOT NULL,
	`reason` text,
	`source_destination` varchar(200),
	`price` decimal(10,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `animal_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `animal_health_records` ADD CONSTRAINT `animal_health_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_reproduction_records` ADD CONSTRAINT `animal_reproduction_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_reproduction_records` ADD CONSTRAINT `animal_reproduction_records_partner_id_animals_id_fk` FOREIGN KEY (`partner_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_weight_records` ADD CONSTRAINT `animal_weight_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_movements` ADD CONSTRAINT `animal_movements_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;