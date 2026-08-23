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
