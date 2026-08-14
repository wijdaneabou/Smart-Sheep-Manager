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
ALTER TABLE `fattening_batch_weight_records` DROP FOREIGN KEY `fattening_batch_weight_records_fattening_batch_id_fattening_batches_id_fk`;
--> statement-breakpoint
ALTER TABLE `fattening_batches` ADD `target_daily_gmq` decimal(5,3);--> statement-breakpoint
ALTER TABLE `fattening_alerts` ADD CONSTRAINT `fattening_alerts_fattening_batch_id_fattening_batches_id_fk` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_alerts` ADD CONSTRAINT `fattening_alerts_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_feed_records` ADD CONSTRAINT `fk_ffr_batch` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batch_costs` ADD CONSTRAINT `fk_fbc_batch` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batch_individual_weights` ADD CONSTRAINT `fk_fiw_batch` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batch_individual_weights` ADD CONSTRAINT `fk_fiw_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fattening_batch_weight_records` ADD CONSTRAINT `fk_fbw_batch` FOREIGN KEY (`fattening_batch_id`) REFERENCES `fattening_batches`(`id`) ON DELETE cascade ON UPDATE no action;