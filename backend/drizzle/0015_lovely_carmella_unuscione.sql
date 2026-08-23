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
