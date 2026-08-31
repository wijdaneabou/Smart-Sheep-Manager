CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL,
	`phone` varchar(20),
	`password` varchar(255) NOT NULL,
	`photo` varchar(255),
	`role_id` int NOT NULL,
	`status` enum('ACTIVE','INACTIVE','SUSPENDED') DEFAULT 'ACTIVE',
	`last_login` timestamp,
	`failed_attempts` int NOT NULL DEFAULT 0,
	`locked_until` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(500) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`code` varchar(6) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exploitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`superficie` decimal(10,2),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`photo` varchar(255),
	`type` enum('OVIN','CAPRIN','MIXTE') NOT NULL DEFAULT 'OVIN',
	`owner_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `exploitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `login_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`ip` varchar(45),
	`user_agent` varchar(255),
	`success` boolean NOT NULL DEFAULT true,
	`login_at` timestamp DEFAULT (now()),
	CONSTRAINT `login_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`module` varchar(100) NOT NULL,
	`action` varchar(100) NOT NULL,
	`description` text,
	`result` varchar(20) NOT NULL,
	`ip` varchar(45),
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`refresh_token` varchar(500) NOT NULL,
	`ip` varchar(100),
	`user_agent` text,
	`login_at` timestamp NOT NULL DEFAULT (now()),
	`logout_at` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`type` enum('BERGERIE','STABULATION','BOX','PARC','PARCELLE') NOT NULL,
	`capacite` int,
	`superficie` decimal(10,2),
	`equipements` text,
	`etat` enum('BON','MOYEN','MAUVAIS') NOT NULL DEFAULT 'BON',
	`occupation_actuelle` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `batiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(30),
	`email` varchar(150),
	`position` varchar(100) NOT NULL,
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employment_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`type` enum('CDI','CDD','TEMPORAIRE','SAISONNIER') NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date,
	`hourly_rate` decimal(10,2) NOT NULL,
	`monthly_salary` decimal(10,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employment_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_hours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`work_date` date NOT NULL,
	`hours` decimal(5,2) NOT NULL,
	`overtime_hours` decimal(5,2) NOT NULL DEFAULT '0',
	`note` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `work_hours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`work_date` date NOT NULL,
	`start_time` varchar(5) NOT NULL,
	`end_time` varchar(5) NOT NULL,
	`task` varchar(255) NOT NULL,
	`status` enum('PLANNED','DONE','CANCELLED') NOT NULL DEFAULT 'PLANNED',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `work_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agricultural_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`type` enum('VACCINATION','TRAITEMENT','PESEE','MISE_BAS','AUTRE') NOT NULL,
	`title` varchar(150) NOT NULL,
	`event_date` date NOT NULL,
	`gestation_week` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `agricultural_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exploitation_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`total_animals` int NOT NULL DEFAULT 0,
	`males` int NOT NULL DEFAULT 0,
	`females` int NOT NULL DEFAULT 0,
	`race_distribution` text,
	`mortality_rate` decimal(5,2) NOT NULL DEFAULT '0',
	`fertility_rate` decimal(5,2) NOT NULL DEFAULT '0',
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `exploitation_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `exploitation_metrics_exploitation_id_unique` UNIQUE(`exploitation_id`)
);
--> statement-breakpoint
CREATE TABLE `farm_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int NOT NULL,
	`type` varchar(80) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`expense_date` timestamp DEFAULT (now()),
	`description` varchar(255),
	CONSTRAINT `farm_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`photo_url` varchar(255),
	`exploitation_id` int,
	`batiment_id` int,
	`lot` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `animals_id` PRIMARY KEY(`id`),
	CONSTRAINT `animals_rfid_unique` UNIQUE(`rfid`)
);
--> statement-breakpoint
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
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`content` text NOT NULL,
	`author_id` int NOT NULL,
	`image_url` varchar(500),
	`status` enum('published','archived') DEFAULT 'published',
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int NOT NULL,
	`prediction` int NOT NULL,
	`probability` decimal(5,4) NOT NULL,
	`risk_level` varchar(20) NOT NULL,
	`threshold_used` decimal(4,2) NOT NULL,
	`profile_used` varchar(20) NOT NULL,
	`explanations` json,
	`feature_values` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feed_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int,
	`name` varchar(255) NOT NULL,
	`category` enum('FOURRAGE','CONCENTRE','MINERAL','VITAMINE','COMPLEMENT','AUTRE') NOT NULL DEFAULT 'AUTRE',
	`unit` enum('KG','L','TONNE','SAC','UNIT') NOT NULL DEFAULT 'KG',
	`unit_price` decimal(10,2) DEFAULT '0.00',
	`current_stock` decimal(12,3) DEFAULT '0.000',
	`min_stock_threshold` decimal(12,3) DEFAULT '0.000',
	`supplier` varchar(255),
	`description` text,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feed_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feed_stocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feed_item_id` int NOT NULL,
	`movement_type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`unit_price_at_time` decimal(10,2),
	`movement_date` date NOT NULL,
	`batch_number` varchar(50),
	`expiry_date` date,
	`reference` varchar(255),
	`notes` text,
	`recorded_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feed_stocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feed_rations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exploitation_id` int,
	`name` varchar(255) NOT NULL,
	`code` varchar(50),
	`target_type` enum('AGNELAUX','AGNEAUX_SEVRAGE','BREBILLONS','BELIERS','AGNELLES','TOUS','AUTRE') NOT NULL DEFAULT 'TOUS',
	`target_weight_kg` decimal(6,2),
	`daily_ration_per_animal_kg` decimal(6,3),
	`cost_per_kg` decimal(10,2) DEFAULT '0.00',
	`description` text,
	`status` enum('ACTIVE','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feed_rations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feed_ration_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ration_id` int NOT NULL,
	`feed_item_id` int NOT NULL,
	`percentage` decimal(5,2) NOT NULL,
	`quantity_kg_per_ton` decimal(8,3),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feed_ration_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feed_distributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ration_id` int,
	`target_type` enum('ANIMAL','BATCH','BATIMENT','LOT') NOT NULL,
	`animal_id` int,
	`batiment_id` int,
	`batch_name` varchar(150),
	`distribution_date` date NOT NULL,
	`time_of_day` enum('MORNING','MIDDAY','EVENING','NIGHT','ALL_DAY') NOT NULL DEFAULT 'ALL_DAY',
	`quantity_distributed_kg` decimal(10,3) NOT NULL,
	`number_of_animals` int,
	`refused_quantity_kg` decimal(10,3) DEFAULT '0.000',
	`weather_conditions` enum('BON','CHAUD','FROID','HUMIDE','SEC') DEFAULT 'BON',
	`notes` text,
	`distributed_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feed_distributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`contact` varchar(255) NOT NULL,
	`type` enum('ACHETEUR','BOUCHER','GROSSISTE','COOPERATIVE') NOT NULL,
	`purchase_history` text,
	`preferences` text,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(60) NOT NULL,
	`description` text,
	`min_score` int DEFAULT 0,
	`max_score` int DEFAULT 100,
	`min_frequency` int DEFAULT 0,
	`max_frequency` int,
	`min_basket` decimal(12,2) DEFAULT '0',
	`max_basket` decimal(12,2),
	`color` varchar(20) DEFAULT '#15803D',
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_segments_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_segments_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `client_loyalty_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`score` int DEFAULT 0,
	`purchase_frequency` int DEFAULT 0,
	`average_basket` decimal(12,2) DEFAULT '0',
	`total_purchases` int DEFAULT 0,
	`total_spent` decimal(12,2) DEFAULT '0',
	`last_purchase_at` timestamp,
	`segment_id` int,
	`auto_segment` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_loyalty_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(150) NOT NULL,
	`description` text,
	`type` enum('VOLUME_DISCOUNT','TARGETED_OFFER') NOT NULL,
	`segment_id` int,
	`min_quantity` int DEFAULT 1,
	`discount_percentage` decimal(5,2),
	`discount_amount` decimal(12,2),
	`valid_from` timestamp NOT NULL,
	`valid_to` timestamp NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyalty_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(150) NOT NULL,
	`message` text NOT NULL,
	`type` enum('AVAILABILITY','PRICE_DROP','NEW_ARRIVAL') NOT NULL,
	`client_id` int,
	`segment_id` int,
	`is_read` boolean DEFAULT false,
	`sent_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyalty_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`category` enum('AGNEAUX','MOUTONS','LAINE','VIANDE','AUTRE') NOT NULL,
	`description` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`availability` enum('DISPONIBLE','LIMITE','RUPTURE') NOT NULL DEFAULT 'DISPONIBLE',
	`photos` text,
	`specifications` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`product_name` varchar(120) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	`total_price` decimal(12,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_number` varchar(50) NOT NULL,
	`status` enum('BROUILLON','ENVOYE','VALIDE','EN_PREPARATION','EXPEDIE','LIVRE','FACTURE','PAYE') NOT NULL DEFAULT 'BROUILLON',
	`client_id` int NOT NULL,
	`client_name` varchar(120) NOT NULL,
	`client_contact` varchar(255) NOT NULL,
	`notes` text,
	`subtotal` decimal(12,2) NOT NULL,
	`tax` decimal(12,2) DEFAULT '0',
	`total` decimal(12,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`delivery_number` varchar(50) NOT NULL,
	`status` enum('EN_ATTENTE','EN_COURS','LIVRE') NOT NULL DEFAULT 'EN_ATTENTE',
	`delivery_date` varchar(20) NOT NULL,
	`address` varchar(255) NOT NULL,
	`carrier` varchar(120) NOT NULL,
	`tracking_number` varchar(120) NOT NULL,
	`delivery_note` text,
	`client_id` int,
	`client_name` varchar(120) NOT NULL,
	`client_contact` varchar(255) NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveries_delivery_number_unique` UNIQUE(`delivery_number`)
);
--> statement-breakpoint
CREATE TABLE `framework_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contract_number` varchar(50) NOT NULL,
	`status` enum('EN_NEGOCIATION','ACTIF','EXPIRE','RESILIE') NOT NULL DEFAULT 'EN_NEGOCIATION',
	`client_id` int NOT NULL,
	`client_name` varchar(120) NOT NULL,
	`monthly_volume` varchar(50) NOT NULL,
	`yearly_volume` varchar(50) NOT NULL,
	`negotiated_price` varchar(50) NOT NULL,
	`start_date` varchar(20) NOT NULL,
	`end_date` varchar(20) NOT NULL,
	`clauses` text,
	`schedule` text,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `framework_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `framework_contracts_contract_number_unique` UNIQUE(`contract_number`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animal_id` int,
	`seller_id` int NOT NULL,
	`seller_name` varchar(120) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`price` varchar(50) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'MAD',
	`location` varchar(255),
	`status` enum('DRAFT','PUBLISHED','SOLD','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`photos` text,
	`specifications` text,
	`views_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `marketplace_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`receiver_id` int NOT NULL,
	`message` text NOT NULL,
	`read_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `marketplace_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`rater_id` int NOT NULL,
	`rated_user_id` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `marketplace_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`buyer_id` int NOT NULL,
	`seller_id` int NOT NULL,
	`amount` varchar(50) NOT NULL,
	`status` enum('PENDING','ESCROW','PAID','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`escrow_reference` varchar(120),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `marketplace_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `dashboard_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_dashboard_widgets` (
	`profile_id` int NOT NULL,
	`widget_type` enum('kpi-herd','kpi-gmq','kpi-fcr','kpi-mortality','chart-gmq-trend','chart-breed-distribution','chart-financial','table-races','table-charges','alerts','calendar') NOT NULL,
	`is_visible` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`size` enum('small','medium','large') NOT NULL DEFAULT 'medium',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_dashboard_widgets_profile_id_widget_type_pk` PRIMARY KEY(`profile_id`,`widget_type`)
);
--> statement-breakpoint
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exploitations` ADD CONSTRAINT `exploitations_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `login_history` ADD CONSTRAINT `login_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batiments` ADD CONSTRAINT `batiments_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employment_contracts` ADD CONSTRAINT `employment_contracts_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_hours` ADD CONSTRAINT `work_hours_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_schedules` ADD CONSTRAINT `work_schedules_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agricultural_events` ADD CONSTRAINT `agricultural_events_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exploitation_metrics` ADD CONSTRAINT `exploitation_metrics_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_expenses` ADD CONSTRAINT `farm_expenses_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animals` ADD CONSTRAINT `animals_father_id_animals_id_fk` FOREIGN KEY (`father_id`) REFERENCES `animals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animals` ADD CONSTRAINT `animals_mother_id_animals_id_fk` FOREIGN KEY (`mother_id`) REFERENCES `animals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animals` ADD CONSTRAINT `animals_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animals` ADD CONSTRAINT `animals_batiment_id_batiments_id_fk` FOREIGN KEY (`batiment_id`) REFERENCES `batiments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_health_records` ADD CONSTRAINT `animal_health_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_reproduction_records` ADD CONSTRAINT `animal_reproduction_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_reproduction_records` ADD CONSTRAINT `animal_reproduction_records_partner_id_animals_id_fk` FOREIGN KEY (`partner_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_weight_records` ADD CONSTRAINT `animal_weight_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_movements` ADD CONSTRAINT `animal_movements_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_bcs_records` ADD CONSTRAINT `animal_bcs_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_records` ADD CONSTRAINT `health_records_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_records` ADD CONSTRAINT `health_records_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `treatments` ADD CONSTRAINT `treatments_health_record_id_health_records_id_fk` FOREIGN KEY (`health_record_id`) REFERENCES `health_records`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `treatments` ADD CONSTRAINT `treatments_administered_by_users_id_fk` FOREIGN KEY (`administered_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vaccinations` ADD CONSTRAINT `vaccinations_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vaccinations` ADD CONSTRAINT `vaccinations_administered_by_users_id_fk` FOREIGN KEY (`administered_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `veterinary_interventions` ADD CONSTRAINT `veterinary_interventions_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `veterinary_interventions` ADD CONSTRAINT `veterinary_interventions_performed_by_users_id_fk` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `predictions` ADD CONSTRAINT `predictions_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_items` ADD CONSTRAINT `feed_items_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_items` ADD CONSTRAINT `feed_items_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_stocks` ADD CONSTRAINT `feed_stocks_feed_item_id_feed_items_id_fk` FOREIGN KEY (`feed_item_id`) REFERENCES `feed_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_stocks` ADD CONSTRAINT `feed_stocks_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_rations` ADD CONSTRAINT `feed_rations_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_rations` ADD CONSTRAINT `feed_rations_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_ration_items` ADD CONSTRAINT `feed_ration_items_ration_id_feed_rations_id_fk` FOREIGN KEY (`ration_id`) REFERENCES `feed_rations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_ration_items` ADD CONSTRAINT `feed_ration_items_feed_item_id_feed_items_id_fk` FOREIGN KEY (`feed_item_id`) REFERENCES `feed_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_distributions` ADD CONSTRAINT `feed_distributions_ration_id_feed_rations_id_fk` FOREIGN KEY (`ration_id`) REFERENCES `feed_rations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_distributions` ADD CONSTRAINT `feed_distributions_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_distributions` ADD CONSTRAINT `feed_distributions_batiment_id_batiments_id_fk` FOREIGN KEY (`batiment_id`) REFERENCES `batiments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_distributions` ADD CONSTRAINT `feed_distributions_distributed_by_users_id_fk` FOREIGN KEY (`distributed_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_loyalty_profiles` ADD CONSTRAINT `client_loyalty_profiles_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_loyalty_profiles` ADD CONSTRAINT `client_loyalty_profiles_segment_id_client_segments_id_fk` FOREIGN KEY (`segment_id`) REFERENCES `client_segments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_offers` ADD CONSTRAINT `loyalty_offers_segment_id_client_segments_id_fk` FOREIGN KEY (`segment_id`) REFERENCES `client_segments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_notifications` ADD CONSTRAINT `loyalty_notifications_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_notifications` ADD CONSTRAINT `loyalty_notifications_segment_id_client_segments_id_fk` FOREIGN KEY (`segment_id`) REFERENCES `client_segments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dashboard_profiles` ADD CONSTRAINT `dashboard_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_dashboard_widgets` ADD CONSTRAINT `user_dashboard_widgets_profile_id_dashboard_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `dashboard_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `repro_cycle_animal_idx` ON `reproduction_cycles` (`animal_id`);--> statement-breakpoint
CREATE INDEX `repro_cycle_heat_date_idx` ON `reproduction_cycles` (`heat_date`);--> statement-breakpoint
CREATE INDEX `mating_animal_idx` ON `mating_services` (`animal_id`);--> statement-breakpoint
CREATE INDEX `mating_cycle_idx` ON `mating_services` (`cycle_id`);--> statement-breakpoint
CREATE INDEX `mating_date_idx` ON `mating_services` (`service_date`);--> statement-breakpoint
CREATE INDEX `idx_animal_id` ON `predictions` (`animal_id`);--> statement-breakpoint
CREATE INDEX `idx_risk_level` ON `predictions` (`risk_level`);--> statement-breakpoint
CREATE INDEX `idx_created_at` ON `predictions` (`created_at`);