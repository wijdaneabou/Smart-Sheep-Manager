ALTER TABLE `animals` ADD COLUMN `batiment_id` int NULL AFTER `exploitation_id`;
ALTER TABLE `animals` ADD COLUMN `lot` varchar(100) NULL AFTER `batiment_id`;
ALTER TABLE `animals` ADD CONSTRAINT `animals_batiment_id_batiments_id_fk` FOREIGN KEY (`batiment_id`) REFERENCES `batiments`(`id`) ON DELETE set null ON UPDATE no action;

CREATE INDEX `idx_animals_exploitation_id` ON `animals` (`exploitation_id`);
CREATE INDEX `idx_animals_breed` ON `animals` (`breed`);
CREATE INDEX `idx_animals_sex` ON `animals` (`sex`);
CREATE INDEX `idx_animals_health_status` ON `animals` (`health_status`);
CREATE INDEX `idx_animals_batiment_id` ON `animals` (`batiment_id`);
CREATE INDEX `idx_animals_birth_date` ON `animals` (`birth_date`);

CREATE INDEX `idx_animal_weight_records_animal_id` ON `animal_weight_records` (`animal_id`);
CREATE INDEX `idx_animal_weight_records_date` ON `animal_weight_records` (`date`);
CREATE INDEX `idx_animal_movements_date` ON `animal_movements` (`date`);
CREATE INDEX `idx_animal_reproduction_records_date` ON `animal_reproduction_records` (`date`);
CREATE INDEX `idx_animal_bcs_records_date` ON `animal_bcs_records` (`date`);
