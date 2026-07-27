import {
  mysqlTable,
  int,
  text,
  decimal,
  date,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { animals } from "./animals.js";

export const animalBcsRecords = mysqlTable("animal_bcs_records", {
  id: int("id").autoincrement().primaryKey(),

  // Animal concerné
  animalId: int("animal_id")
    .references(() => animals.id, { onDelete: "cascade" })
    .notNull(),

  // Score BCS global (1.0 à 5.0)
  bcsScore: decimal("bcs_score", { precision: 3, scale: 1 }).notNull(),

  // Critères anatomiques radar (1.0 à 5.0)
  spinousProcesses: decimal("spinous_processes", { precision: 3, scale: 1 }), // Apophyses épineuses
  transverseProcesses: decimal("transverse_processes", { precision: 3, scale: 1 }), // Apophyses transverses
  eyeMuscle: decimal("eye_muscle", { precision: 3, scale: 1 }), // Muscle de la longe
  fatCover: decimal("fat_cover", { precision: 3, scale: 1 }), // Couverture graisseuse
  tailDock: decimal("tail_dock", { precision: 3, scale: 1 }), // Attache queue / sternum

  // Date de l'évaluation
  date: date("date").notNull(),

  // Évaluateur (Vétérinaire / Éleveur / Technicien)
  evaluator: varchar("evaluator", { length: 100 }),

  // Notes et remarques libres
  notes: text("notes"),

  // Conseil / Recommandation nutritionnelle
  nutritionalRecommendation: text("nutritional_recommendation"),

  createdAt: timestamp("created_at").defaultNow(),
});
