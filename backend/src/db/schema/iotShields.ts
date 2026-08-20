import {
  mysqlTable,
  int,
  varchar,
  decimal,
  mysqlEnum,
  timestamp,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { exploitations } from "./exploitations.js";
import { animals } from "./animals.js";
import { iotShieldSensors } from "./iotShieldSensors.js";
import { relations } from "drizzle-orm";

export const iotShields = mysqlTable("iot_shields", {
  id: int("id").autoincrement().primaryKey(),

  // Numéro SSM-IOT-XXXXXX (ex: SSM-IOT-000123)
  ssmIotNumber: varchar("ssm_iot_number", { length: 50 })
    .notNull()
    .unique(),

  // Clé API du bouclier, utilisée par le capteur physique pour s'authentifier
  apiKey: varchar("api_key", { length: 64 }).notNull().unique(),

  // Niveau de batterie (pourcentage 0-100)
  battery: decimal("battery", { precision: 5, scale: 2 }).notNull().default("100"),

  // Animal associé (optionnel — un bouclier peut être inscrit sans animal)
  animalId: int("animal_id").references(
    (): AnyMySqlColumn => animals.id
  ),

  // Statut du bouclier (actif / inactif)
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE"])
    .notNull()
    .default("ACTIVE"),

  // Exploitation propriétaire
  exploitationId: int("exploitation_id").references(
    (): AnyMySqlColumn => exploitations.id
  ),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const iotShieldsRelations = relations(iotShields, ({ one, many }) => ({
  animal: one(animals, {
    fields: [iotShields.animalId],
    references: [animals.id],
  }),
  exploitation: one(exploitations, {
    fields: [iotShields.exploitationId],
    references: [exploitations.id],
  }),
  sensors: many(iotShieldSensors),
}));
