import {
  mysqlTable,
  int,
  decimal,
  mysqlEnum,
  timestamp,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { iotShields } from "./iotShields.js";
import { relations } from "drizzle-orm";

/**
 * Table "état courant" : UNE SEULE ligne par bouclier, mise à jour
 * (upsert) à chaque nouvelle mesure. Sert exclusivement au suivi en
 * temps réel (US-4.2) — reste légère quel que soit le nombre de
 * mesures envoyées au fil du temps.
 * L'historique complet continue d'être écrit dans iot_sensor_data.
 */
export const iotShieldStatus = mysqlTable("iot_shield_status", {
  shieldId: int("shield_id")
    .primaryKey()
    .references((): AnyMySqlColumn => iotShields.id, { onDelete: "cascade" }),

  temperature: decimal("temperature", { precision: 4, scale: 2 }),
  activity: mysqlEnum("activity", ["REST", "MOVEMENT", "GRAZING"]),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),

  measuredAt: timestamp("measured_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const iotShieldStatusRelations = relations(iotShieldStatus, ({ one }) => ({
  shield: one(iotShields, {
    fields: [iotShieldStatus.shieldId],
    references: [iotShields.id],
  }),
}));