CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`category` enum('AGNEAUX','MOUTONS','LAINE','VIANDE','AUTRE') NOT NULL,
	`description` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`availability` enum('DISPONIBLE','LIMITE','RUPTURE') NOT NULL DEFAULT 'DISPONIBLE',
	`photos` text,
	`specifications` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
