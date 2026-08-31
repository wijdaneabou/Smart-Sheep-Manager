CREATE TABLE `iot_shield_sensors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shield_id` int NOT NULL,
	`sensor_type` enum('TEMPERATURE','ACTIVITY','GPS') NOT NULL,
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `iot_shield_sensors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `iot_shield_sensors` ADD CONSTRAINT `iot_shield_sensors_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO `iot_shield_sensors` (`shield_id`, `sensor_type`, `status`, `created_at`, `updated_at`)
SELECT `id`, CASE `sensor_type`
  WHEN 'LOCALIZATION' THEN 'GPS'
  WHEN 'TEMPERATURE' THEN 'TEMPERATURE'
  WHEN 'ACTIVITY' THEN 'ACTIVITY'
  ELSE 'GPS'
END, 'ACTIVE', NOW(), NOW()
FROM `iot_shields`
WHERE `sensor_type` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `iot_shields` DROP COLUMN `sensor_type`;