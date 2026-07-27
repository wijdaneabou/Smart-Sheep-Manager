CREATE TABLE `animal_bcs_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`bcs_score` decimal(3,1) NOT NULL,
	`spinous_processes` decimal(3,1),
	`transverse_processes` decimal(3,1),
	`eye_muscle` decimal(3,1),
	`fat_cover` decimal(3,1),
	`tail_dock` decimal(3,1),
	`date` date NOT NULL,
	`evaluator` varchar(100),
	`notes` text,
	`nutritional_recommendation` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `animal_bcs_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `animals` ADD `photo_url` varchar(255);--> statement-breakpoint
ALTER TABLE `animal_bcs_records` ADD CONSTRAINT `animal_bcs_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;