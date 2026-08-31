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
