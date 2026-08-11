CREATE TABLE `iot_sensor_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shield_id` int NOT NULL,
	`temperature` decimal(4,2),
	`activity` enum('REST','MOVEMENT','GRAZING'),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`measured_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `iot_sensor_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `iot_sensor_data_shield_id_iot_shields_id_fk` FOREIGN KEY (`shield_id`) REFERENCES `iot_shields`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `idx_iot_sensor_data_shield_id` ON `iot_sensor_data`(`shield_id`);--> statement-breakpoint
CREATE INDEX `idx_iot_sensor_data_measured_at` ON `iot_sensor_data`(`measured_at`);
