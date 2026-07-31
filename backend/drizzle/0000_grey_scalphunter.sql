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
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` int NOT NULL,
	`permission_id` int NOT NULL,
	CONSTRAINT `role_permissions_role_id_permission_id_pk` PRIMARY KEY(`role_id`,`permission_id`)
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
ALTER TABLE `veterinary_interventions` ADD CONSTRAINT `veterinary_interventions_performed_by_users_id_fk` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;