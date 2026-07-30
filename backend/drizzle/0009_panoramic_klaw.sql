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
ALTER TABLE `batiments` ADD CONSTRAINT `batiments_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employment_contracts` ADD CONSTRAINT `employment_contracts_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_hours` ADD CONSTRAINT `work_hours_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_schedules` ADD CONSTRAINT `work_schedules_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agricultural_events` ADD CONSTRAINT `agricultural_events_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exploitation_metrics` ADD CONSTRAINT `exploitation_metrics_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_expenses` ADD CONSTRAINT `farm_expenses_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;