CREATE TABLE `batiments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `exploitation_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('BERGERIE','STABULATION','BOX','PARC','PARCELLE') NOT NULL,
  `capacite` int,
  `superficie` decimal(10,2),
  `equipements` text,
  `etat` enum('BON','MOYEN','MAUVAIS') NOT NULL DEFAULT 'BON',
  `occupation_actuelle` int NOT NULL DEFAULT 0,
  `created_at` timestamp DEFAULT (now()),
  `updated_at` timestamp DEFAULT (now()),
  CONSTRAINT `batiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `batiments` ADD CONSTRAINT `batiments_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action;
