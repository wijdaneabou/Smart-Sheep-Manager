CREATE TABLE `iot_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shield_id` int NOT NULL,
	`animal_id` int,
	`exploitation_id` int,
	`type` enum('HIGH_TEMPERATURE','INACTIVITY','LOW_BATTERY','OUT_OF_ZONE') NOT NULL,
	`severity` enum('WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
	`message` text NOT NULL,
	`value` varchar(100),
	`threshold` varchar(100),
	`resolved` int NOT NULL DEFAULT 0,
	`resolved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE (now()),
	CONSTRAINT `iot_alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `iot_alerts_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `iot_alerts_animal_id_animals_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE SET NULL ON UPDATE no action,
	CONSTRAINT `iot_alerts_exploitation_id_exploitations_id_fk` FOREIGN KEY (`exploitation_id`) REFERENCES `exploitations`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `idx_iot_alerts_shield_id` ON `iot_alerts`(`shield_id`);--> statement-breakpoint
CREATE INDEX `idx_iot_alerts_exploitation_id` ON `iot_alerts`(`exploitation_id`);--> statement-breakpoint
CREATE INDEX `idx_iot_alerts_type` ON `iot_alerts`(`type`);--> statement-breakpoint
CREATE INDEX `idx_iot_alerts_resolved` ON `iot_alerts`(`resolved`);--> statement-breakpoint
CREATE INDEX `idx_iot_alerts_created_at` ON `iot_alerts`(`created_at`);
