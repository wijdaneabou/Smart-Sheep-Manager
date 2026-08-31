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
ALTER TABLE `client_loyalty_profiles` ADD CONSTRAINT `client_loyalty_profiles_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_loyalty_profiles` ADD CONSTRAINT `client_loyalty_profiles_segment_id_client_segments_id_fk` FOREIGN KEY (`segment_id`) REFERENCES `client_segments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_offers` ADD CONSTRAINT `loyalty_offers_segment_id_client_segments_id_fk` FOREIGN KEY (`segment_id`) REFERENCES `client_segments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_notifications` ADD CONSTRAINT `loyalty_notifications_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_notifications` ADD CONSTRAINT `loyalty_notifications_segment_id_client_segments_id_fk` FOREIGN KEY (`segment_id`) REFERENCES `client_segments`(`id`) ON DELETE set null ON UPDATE no action;