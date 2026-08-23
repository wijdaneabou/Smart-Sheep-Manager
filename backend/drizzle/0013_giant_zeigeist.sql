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
