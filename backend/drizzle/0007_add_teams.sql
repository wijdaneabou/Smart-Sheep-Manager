CREATE TABLE `employees` (`id` int AUTO_INCREMENT NOT NULL, `exploitation_id` int NOT NULL, `first_name` varchar(100) NOT NULL, `last_name` varchar(100) NOT NULL, `phone` varchar(30), `email` varchar(150), `position` varchar(100) NOT NULL, `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE', `created_at` timestamp DEFAULT (now()), `updated_at` timestamp DEFAULT (now()), CONSTRAINT `employees_id` PRIMARY KEY(`id`));
--> statement-breakpoint
CREATE TABLE `employment_contracts` (`id` int AUTO_INCREMENT NOT NULL, `employee_id` int NOT NULL, `type` enum('CDI','CDD','TEMPORAIRE','SAISONNIER') NOT NULL, `start_date` date NOT NULL, `end_date` date, `hourly_rate` decimal(10,2) NOT NULL, `monthly_salary` decimal(10,2), `created_at` timestamp DEFAULT (now()), CONSTRAINT `employment_contracts_id` PRIMARY KEY(`id`));
--> statement-breakpoint
CREATE TABLE `work_schedules` (`id` int AUTO_INCREMENT NOT NULL, `employee_id` int NOT NULL, `work_date` date NOT NULL, `start_time` varchar(5) NOT NULL, `end_time` varchar(5) NOT NULL, `task` varchar(255) NOT NULL, `status` enum('PLANNED','DONE','CANCELLED') NOT NULL DEFAULT 'PLANNED', `created_at` timestamp DEFAULT (now()), CONSTRAINT `work_schedules_id` PRIMARY KEY(`id`));
--> statement-breakpoint
CREATE TABLE `work_hours` (`id` int AUTO_INCREMENT NOT NULL, `employee_id` int NOT NULL, `work_date` date NOT NULL, `hours` decimal(5,2) NOT NULL, `overtime_hours` decimal(5,2) NOT NULL DEFAULT 0, `note` varchar(255), `created_at` timestamp DEFAULT (now()), CONSTRAINT `work_hours_id` PRIMARY KEY(`id`));
--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `employment_contracts` ADD CONSTRAINT `employment_contracts_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `work_schedules` ADD CONSTRAINT `work_schedules_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `work_hours` ADD CONSTRAINT `work_hours_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;
