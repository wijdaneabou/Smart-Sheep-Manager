CREATE TABLE `reproduction_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`heat_date` date NOT NULL,
	`mating_type` varchar(20) NOT NULL,
	`male_id` int,
	`semen_reference` varchar(100),
	`pregnancy_confirmed` boolean DEFAULT false,
	`confirmation_date` date,
	`expected_lambing_date` date,
	`ultrasound_notes` text,
	`lambing_date` date,
	`lambing_type` varchar(10),
	`live_born` int,
	`still_born` int,
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reproduction_cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `user_exploitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`exploitation_id` int NOT NULL,
	`role` enum('OWNER','MANAGER','EMPLOYEE','VET') NOT NULL DEFAULT 'EMPLOYEE',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_exploitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iot_shields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ssm_iot_number` varchar(50) NOT NULL,
	`api_key` varchar(64) NOT NULL,
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
CREATE TABLE `iot_shield_sensors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shield_id` int NOT NULL,
	`sensor_type` enum('TEMPERATURE','ACTIVITY','GPS') NOT NULL,
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `iot_shield_sensors_id` PRIMARY KEY(`id`)
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
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`year` int NOT NULL,
	`month` int,
	`category` enum('ALIMENTATION','SANTE','MAIN_DOEUVRE','EQUIPMENT','REPRODUCTION','IOT','DIVERS') NOT NULL,
	`planned_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`actual_amount` decimal(12,2) DEFAULT '0.00',
	`notes` text,
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`category` enum('ALIMENTATION','SANTE','REPRODUCTION','MAIN_DOEUVRE','EQUIPMENT','IOT','DIVERS') NOT NULL,
	`beneficiary` varchar(255),
	`payment_method` enum('CASH','BANK_TRANSFER','CHECK','CARD','OTHER') DEFAULT 'CASH',
	`justification` text,
	`notes` text,
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`type` enum('LAMB_SALE','WOOL_SALE','BY_PRODUCT','OTHER') NOT NULL,
	`quantity` decimal(10,2),
	`unit_price` decimal(12,2),
	`total_ht` decimal(12,2) NOT NULL,
	`total_ttc` decimal(12,2) NOT NULL,
	`buyer` varchar(255),
	`payment_method` enum('CASH','BANK_TRANSFER','CHECK','CARD','OTHER') DEFAULT 'CASH',
	`status` enum('COLLECTED','PENDING') DEFAULT 'PENDING',
	`notes` text,
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revenues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fattening_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fattening_batch_id` int NOT NULL,
	`exploitation_id` int,
	`type` enum('LOW_GMQ','WEIGHT_DEVIATION') NOT NULL,
	`severity` enum('WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
	`message` text NOT NULL,
	`value` varchar(100),
	`threshold` varchar(100),
	`resolved` int NOT NULL DEFAULT 0,
	`resolved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `fattening_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fattening_batch_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fattening_batch_id` int NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` varchar(255),
	`amount` decimal(12,2) NOT NULL,
	`date` date NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fattening_batch_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fattening_batch_individual_weights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fattening_batch_id` int NOT NULL,
	`animal_id` int,
	`weight` decimal(6,2) NOT NULL,
	`date` date NOT NULL,
	`note` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fattening_batch_individual_weights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fattening_batch_weight_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fattening_batch_id` int NOT NULL,
	`average_weight` decimal(6,2) NOT NULL,
	`date` date NOT NULL,
	`note` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fattening_batch_weight_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fattening_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`start_date` date NOT NULL,
	`animal_count` int NOT NULL,
	`initial_average_weight` decimal(6,2) NOT NULL,
	`target_weight` decimal(6,2) NOT NULL,
	`target_daily_gmq` decimal(5,3),
	`estimated_end_date` date,
	`status` enum('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
	`exploitation_id` int,
	`notes` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `fattening_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fattening_feed_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fattening_batch_id` int NOT NULL,
	`date` date NOT NULL,
	`feed_type` varchar(120) NOT NULL,
	`quantity_kg` decimal(10,3) NOT NULL,
	`unit_price` decimal(12,3) NOT NULL,
	`total_cost` decimal(12,2) NOT NULL,
	`note` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fattening_feed_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD CONSTRAINT `reproduction_cycles_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD CONSTRAINT `reproduction_cycles_male_id_animals_id_fk` FOREIGN KEY (`male_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reproduction_cycles` ADD CONSTRAINT `reproduction_cycles_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mating_services` ADD CONSTRAINT `mating_services_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mating_services` ADD CONSTRAINT `mating_services_cycle_id_reproduction_cycles_id_fk` FOREIGN KEY (`cycle_id`) REFERENCES `reproduction_cycles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mating_services` ADD CONSTRAINT `mating_services_male_id_animals_id_fk` FOREIGN KEY (`male_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mating_services` ADD CONSTRAINT `mating_services_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_exploitations` ADD CONSTRAINT `user_exploitations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_exploitations` ADD CONSTRAINT `user_exploitations_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_shields` ADD CONSTRAINT `iot_shields_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_shields` ADD CONSTRAINT `iot_shields_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_shield_sensors` ADD CONSTRAINT `iot_shield_sensors_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_sensor_data` ADD CONSTRAINT `iot_sensor_data_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_alerts` ADD CONSTRAINT `iot_alerts_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_alerts` ADD CONSTRAINT `iot_alerts_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_alerts` ADD CONSTRAINT `iot_alerts_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_zones` ADD CONSTRAINT `iot_zones_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iot_shield_status` ADD CONSTRAINT `iot_shield_status_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenues` ADD CONSTRAINT `revenues_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenues` ADD CONSTRAINT `revenues_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenues` ADD CONSTRAINT `revenues_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_alerts` ADD CONSTRAINT `fattening_alerts_fattening_batch_id_fattening_batches_id_fk` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_alerts` ADD CONSTRAINT `fattening_alerts_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batch_costs` ADD CONSTRAINT `fk_fbc_batch` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batch_individual_weights` ADD CONSTRAINT `fk_fiw_batch` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batch_individual_weights` ADD CONSTRAINT `fk_fiw_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batch_weight_records` ADD CONSTRAINT `fk_fbw_batch` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batches` ADD CONSTRAINT `fattening_batches_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_feed_records` ADD CONSTRAINT `fk_ffr_batch` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `repro_cycle_animal_idx` ON `reproduction_cycles` (`animal_id`);--> statement-breakpoint
CREATE INDEX `repro_cycle_heat_date_idx` ON `reproduction_cycles` (`heat_date`);--> statement-breakpoint
CREATE INDEX `mating_animal_idx` ON `mating_services` (`animal_id`);--> statement-breakpoint
CREATE INDEX `mating_cycle_idx` ON `mating_services` (`cycle_id`);--> statement-breakpoint
CREATE INDEX `mating_date_idx` ON `mating_services` (`service_date`);