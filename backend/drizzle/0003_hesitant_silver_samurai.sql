CREATE TABLE `iot_shields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ssm_iot_number` varchar(50) NOT NULL,
	`api_key` varchar(64) NOT NULL,
	`sensor_type` enum('LOCALIZATION','TEMPERATURE','ACTIVITY','FEEDING','WATER_INTAKE','HEART_RATE') NOT NULL,
	`battery` decimal(5,2) NOT NULL DEFAULT '100',
	`animal_id` int,
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`exploitation_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `iot_shields_id` PRIMARY KEY(`id`),
	CONSTRAINT `iot_shields_ssm_iot_number_unique` UNIQUE(`ssm_iot_number`),
	CONSTRAINT `iot_shields_api_key_unique` UNIQUE(`api_key`)
);
--> statement-breakpoint
CREATE TABLE `iot_sensor_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shield_id` int NOT NULL,
	`temperature` decimal(4,2),
	`activity` enum('REST','MOVEMENT','GRAZING'),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`measured_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `iot_sensor_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iot_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shield_id` int NOT NULL,
	`animal_id` int,
	`exploitation_id` int,
	`type` enum('HIGH_TEMPERATURE','INACTIVITY','LOW_BATTERY','OUT_OF_ZONE') NOT NULL,
	`severity` enum('WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
	`message` text NOT NULL,
	`value` varchar(100),
	`threshold` varchar(100),
	`resolved` int NOT NULL DEFAULT 0,
	`resolved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `iot_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iot_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) DEFAULT '#0F7A3C',
	`polygon` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iot_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iot_shield_status` (
	`shield_id` int NOT NULL,
	`temperature` decimal(4,2),
	`activity` enum('REST','MOVEMENT','GRAZING'),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`measured_at` timestamp NOT NULL,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iot_shield_status_shield_id` PRIMARY KEY(`shield_id`)
);
--> statement-breakpoint
CREATE TABLE `fattening_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`start_date` date NOT NULL,
	`animal_count` int NOT NULL,
	`initial_average_weight` decimal(6,2) NOT NULL,
	`target_weight` decimal(6,2) NOT NULL,
	`estimated_end_date` date,
	`status` enum('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
	`exploitation_id` int,
	`notes` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `fattening_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `iot_shields` ADD CONSTRAINT `iot_shields_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_shields` ADD CONSTRAINT `iot_shields_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_sensor_data` ADD CONSTRAINT `iot_sensor_data_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_alerts` ADD CONSTRAINT `iot_alerts_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_alerts` ADD CONSTRAINT `iot_alerts_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_alerts` ADD CONSTRAINT `iot_alerts_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_zones` ADD CONSTRAINT `iot_zones_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_shield_status` ADD CONSTRAINT `iot_shield_status_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batches` ADD CONSTRAINT `fattening_batches_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;