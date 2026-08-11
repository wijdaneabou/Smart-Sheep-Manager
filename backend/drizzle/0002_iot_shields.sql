CREATE TABLE `iot_shields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ssm_iot_number` varchar(50) NOT NULL,
	`sensor_type` enum('LOCALIZATION','TEMPERATURE','ACTIVITY','FEEDING','WATER_INTAKE','HEART_RATE') NOT NULL,
	`battery` decimal(5,2) NOT NULL DEFAULT '100',
	`animal_id` int,
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`exploitation_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `iot_shields_id` PRIMARY KEY(`id`),
	CONSTRAINT `iot_shields_ssm_iot_number_unique` UNIQUE(`ssm_iot_number`)
);
--> statement-breakpoint
ALTER TABLE `iot_shields` ADD CONSTRAINT `iot_shields_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_shields` ADD CONSTRAINT `iot_shields_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE set null ON UPDATE no action;
