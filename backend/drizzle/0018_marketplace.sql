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
