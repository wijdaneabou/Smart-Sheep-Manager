CREATE TABLE `animal_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`type` enum('ENTRY','EXIT','DEATH','SALE','PURCHASE') NOT NULL,
	`date` date NOT NULL,
	`reason` text,
	`source_destination` varchar(200),
	`price` decimal(10,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `animal_movements_id` PRIMARY KEY(`id`),
	CONSTRAINT `animal_movements_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action
);
