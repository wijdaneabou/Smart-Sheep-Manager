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
ALTER TABLE `feed_distributions` ADD CONSTRAINT `feed_distributions_distributed_by_users_id_fk` FOREIGN KEY (`distributed_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;