/**
 * backend/src/db/seeds/bi/seedBiData.ts
 * ------------------------------------------------------------------
 * Seed de données réalistes pour le Module 12 (BI Dashboard & Analytics)
 * du projet Smart Sheep Manager.
 *
 * Ce script est ADDITIF : il ne supprime rien, il complète la base
 * existante (ssm.sql). Il réutilise l'exploitation n°1 existante et
 * ajoute 2 exploitations supplémentaires pour permettre le benchmark
 * multi-exploitations (US-12.3, US-12.7).
 *
 * Tables alimentées (toutes basées sur les noms/colonnes exacts de
 * ssm.sql — aucun nom inventé) :
 *   - exploitations, batiments
 *   - animals, animal_weight_records, animal_bcs_records,
 *     animal_health_records, vaccinations, animal_reproduction_records,
 *     animal_movements
 *   - feed_items, feed_rations, feed_ration_items,
 *     feed_distributions, feed_stocks
 *   - fattening_batches, fattening_batch_weight_records,
 *     fattening_batch_individual_weights, fattening_batch_costs,
 *     fattening_feed_records, fattening_alerts
 *   - budgets, expenses, revenues
 *
 * USAGE
 * ------------------------------------------------------------------
 *   1) Adapter les variables de connexion ci-dessous (ou définir un
 *      fichier .env avec DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME).
 *      Si ton backend expose déjà une connexion mysql2 partagée
 *      (ex: `import { pool } from "../../client"`), remplace la section
 *      "CONNEXION" par cet import et supprime `createConnectionPool()`.
 *   2) Ajuster SEED_CONFIG si tu veux plus/moins de volume.
 *   3) Lancer :  npx ts-node backend/src/db/seeds/bi/seedBiData.ts
 *      (ou compiler puis `node dist/.../seedBiData.js`)
 *
 * Le script est idempotent au sens où il n'écrase rien : le relancer
 * ajoutera simplement un nouveau lot de données (utile pour "recharger"
 * un jeu plus gros, mais pense à faire un dump avant si tu veux repartir propre).
 * ------------------------------------------------------------------
 */

import "dotenv/config";
import mysql, { Pool, PoolConnection, ResultSetHeader } from "mysql2/promise";

// ============================================================
// CONFIGURATION
// ============================================================

const SEED_CONFIG = {
  EXPLOITATIONS_TO_ADD: 2, // + l'exploitation n°1 existante = 3 au total
  ANIMALS_PER_EXPLOITATION: 45,
  MONTHS_OF_HISTORY: 18, // profondeur d'historique pour toutes les séries temporelles
  FATTENING_BATCHES_PER_EXPLOITATION: 3,
};

const DB_CONFIG = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "ssm",
};

// ============================================================
// HELPERS GÉNÉRIQUES
// ============================================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function chance(probability: number): boolean {
  return Math.random() < probability;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toSqlDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toSqlDateTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

const NOW = new Date("2026-08-22T10:00:00Z");
const HISTORY_START = addMonths(NOW, -SEED_CONFIG.MONTHS_OF_HISTORY);

/**
 * Insertion en masse avec récupération des IDs auto-incrémentés.
 * Hypothèse : la table est en AUTO_INCREMENT continu (vrai en seed
 * sur une base qui ne reçoit pas d'écritures concurrentes).
 */
async function bulkInsertReturningIds(
  conn: PoolConnection,
  table: string,
  columns: string[],
  rows: unknown[][],
  chunkSize = 300
): Promise<number[]> {
  const ids: number[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
    const sql = `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(",")}) VALUES ${placeholders}`;
    const flat = chunk.flat();
    const [result] = await conn.query<ResultSetHeader>(sql, flat);
    const firstId = result.insertId;
    for (let j = 0; j < chunk.length; j++) ids.push(firstId + j);
  }
  return ids;
}

async function bulkInsert(
  conn: PoolConnection,
  table: string,
  columns: string[],
  rows: unknown[][],
  chunkSize = 300
): Promise<number> {
  let count = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
    const sql = `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(",")}) VALUES ${placeholders}`;
    const flat = chunk.flat();
    await conn.query(sql, flat);
    count += chunk.length;
  }
  return count;
}

// ============================================================
// DONNÉES DE RÉFÉRENCE (contexte marocain, cohérent avec le CDC)
// ============================================================

const BREEDS = ["Sardi", "Timahdite", "D'man", "Beni-Guil"] as const;
const SHEEP_NAMES = [
  "Brebis 001", "Brebis 002", "Brebis 003", "Brebis 004", "Brebis 005",
  "Brebis 006", "Brebis 007", "Brebis 008", "Brebis 009", "Brebis 010",
  "Bélier 001", "Bélier 002", "Bélier 003", "Bélier 004", "Bélier 005",
  "Agnelle 001", "Agnelle 002", "Agnelle 003", "Agnelle 004", "Agnelle 005",
  "Agneau 001", "Agneau 002", "Agneau 003", "Agneau 004", "Agneau 005",
  "Mouton 001", "Mouton 002", "Mouton 003", "Mouton 004", "Mouton 005",
  "Biquette 001", "Biquette 002", "Biquette 003", "Biquette 004", "Biquette 005",
  "Chèvre 001", "Chèvre 002", "Chèvre 003", "Chèvre 004", "Chèvre 005",
  "Bergère 001", "Bergère 002", "Bergère 003", "Bergère 004", "Bergère 005",
  "Troupeau A", "Troupeau B", "Troupeau C", "Troupeau D", "Troupeau E",
] as const;

const EXPLOITATION_NAMES = [
  { name: "Ferme Atlas Ovins", lat: 32.3372, lng: -6.3498 }, // Béni Mellal
  { name: "Coopérative Sardi du Nord", lat: 34.0331, lng: -5.0003 }, // Taza
] as const;

const VACCINE_TYPES = [
  "Clavelée", "Entérotoxémie", "Fièvre aphteuse", "Peste des Petits Ruminants (PPR)", "Pasteurellose",
] as const;

const HEALTH_TITLES: Record<string, string[]> = {
  HEALTH_CHECK: ["Contrôle de routine", "Visite de suivi trimestrielle", "Contrôle post-vaccination"],
  VACCINATION: ["Campagne de vaccination", "Rappel vaccinal"],
  TREATMENT: ["Traitement antiparasitaire", "Traitement antibiotique", "Traitement anti-inflammatoire"],
  ILLNESS: ["Épisode de fièvre", "Diarrhée légère", "Boiterie", "Toux et signes respiratoires"],
};

const FEED_ITEM_TEMPLATE = [
  { name: "Foin de luzerne", category: "FOURRAGE", unit: "KG", basePrice: 3.5 },
  { name: "Foin d'avoine", category: "FOURRAGE", unit: "KG", basePrice: 2.8 },
  { name: "Concentré agneaux engraissement", category: "CONCENTRE", unit: "KG", basePrice: 5.2 },
  { name: "Concentré brebis allaitantes", category: "CONCENTRE", unit: "KG", basePrice: 4.8 },
  { name: "Concentré béliers", category: "CONCENTRE", unit: "KG", basePrice: 4.5 },
  { name: "Minéral D3", category: "MINERAL", unit: "KG", basePrice: 12.0 },
  { name: "Sel de cuisine", category: "MINERAL", unit: "KG", basePrice: 1.5 },
  { name: "Mélasse de canne à sucre", category: "COMPLEMENT", unit: "L", basePrice: 2.2 },
  { name: "Paille de blé", category: "FOURRAGE", unit: "KG", basePrice: 1.2 },
  { name: "Orge grain concassé", category: "CONCENTRE", unit: "KG", basePrice: 3.8 },
] as const;

const EXPENSE_CATEGORIES = ["ALIMENTATION", "SANTE", "REPRODUCTION", "MAIN_DOEUVRE", "EQUIPMENT", "IOT", "DIVERS"] as const;
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CHECK", "CARD", "OTHER"] as const;
const REVENUE_TYPES = ["LAMB_SALE", "WOOL_SALE", "BY_PRODUCT", "OTHER"] as const;

const EXPENSE_BENEFICIARIES: Record<string, string[]> = {
  ALIMENTATION: ["Coopérative Agricole", "Provenderie Al Kabira", "Fournisseur Local"],
  SANTE: ["Clinique Vétérinaire Ouest", "Pharmacie Vétérinaire Centrale", "Dr. Bennani"],
  REPRODUCTION: ["Élevage du Soleil", "Centre d'Insémination Régional"],
  MAIN_DOEUVRE: ["Coop Éleveurs", "Main d'œuvre saisonnière"],
  EQUIPMENT: ["Ferreterie D'Armor", "Quincaillerie Rurale"],
  IOT: ["Tech Bovins SARL"],
  DIVERS: ["Transporteur Local", "Divers"],
};

const LAMB_BUYERS = ["Boucherie des Cimes", "Abattoir Régional", "Marché aux Moutons"];
const WOOL_BUYERS = ["Filature du Nord"];

// ============================================================
// TYPES INTERNES
// ============================================================

interface AnimalSeed {
  id: number;
  exploitationId: number;
  breed: string;
  sex: "MALE" | "FEMALE";
  birthDate: Date;
  fatherId: number | null;
  motherId: number | null;
  isFattening: boolean;
}

// ============================================================
// GÉNÉRATION : EXPLOITATIONS & BATIMENTS
// ============================================================

async function ensureBaseExploitation(conn: PoolConnection): Promise<number> {
  const [rows] = await conn.query<any[]>("SELECT id FROM `exploitations` WHERE id = 1 LIMIT 1");
  if (Array.isArray(rows) && rows.length > 0) return 1;

  const ids = await bulkInsertReturningIds(
    conn,
    "exploitations",
    ["name", "superficie", "latitude", "longitude", "photo", "type", "owner_id", "created_at", "updated_at"],
    [["Expo1", 1500.0, 31.493359, -9.7550579, null, "OVIN", 1, toSqlDateTime(NOW), toSqlDateTime(NOW)]]
  );
  return ids[0];
}

async function seedExtraExploitations(conn: PoolConnection): Promise<number[]> {
  const rows = EXPLOITATION_NAMES.slice(0, SEED_CONFIG.EXPLOITATIONS_TO_ADD).map((e) => [
    e.name,
    randFloat(600, 2500, 2),
    e.lat,
    e.lng,
    null,
    "OVIN",
    1,
    toSqlDateTime(HISTORY_START),
    toSqlDateTime(NOW),
  ]);
  return bulkInsertReturningIds(
    conn,
    "exploitations",
    ["name", "superficie", "latitude", "longitude", "photo", "type", "owner_id", "created_at", "updated_at"],
    rows
  );
}

async function seedBatiments(conn: PoolConnection, exploitationIds: number[]): Promise<Map<number, number[]>> {
  const rows: unknown[][] = [];
  const map = new Map<number, number[]>();
  const types = ["BERGERIE", "STABULATION", "PARC"];
  for (const expId of exploitationIds) {
    map.set(expId, []);
    for (const type of types) {
      rows.push([
        expId,
        `${type === "BERGERIE" ? "Bergerie" : type === "STABULATION" ? "Stabulation" : "Parc"} principal${type === "PARC" ? "e" : ""}`,
        type,
        randInt(40, 150),
        randFloat(200, 1000, 1),
        "Abreuvoirs, mangeoires",
        "BON",
        randInt(10, 40),
        toSqlDateTime(HISTORY_START),
        toSqlDateTime(NOW),
      ]);
    }
  }
  const ids = await bulkInsertReturningIds(
    conn,
    "batiments",
    [
      "exploitation_id", "name", "type", "capacite", "superficie", "equipements",
      "etat", "occupation_actuelle", "created_at", "updated_at",
    ],
    rows
  );
  // Répartir les ids générés dans la map, dans le même ordre que l'insertion
  let idx = 0;
  for (const expId of exploitationIds) {
    for (let i = 0; i < types.length; i++) {
      map.get(expId)!.push(ids[idx]);
      idx++;
    }
  }
  return map;
}

// ============================================================
// GÉNÉRATION : ANIMAUX & SUIVI INDIVIDUEL
// ============================================================

function breedBaseWeight(breed: string, sex: string): number {
  const base: Record<string, number> = { Sardi: 70, Timahdite: 65, "D'man": 55, "Beni-Guil": 60 };
  const b = base[breed] ?? 65;
  return sex === "MALE" ? b * 1.25 : b;
}

async function seedAnimalsForExploitation(
  conn: PoolConnection,
  exploitationId: number,
  rfidPrefix: string
): Promise<AnimalSeed[]> {
  const count = SEED_CONFIG.ANIMALS_PER_EXPLOITATION;
  const adultCount = Math.round(count * 0.65);
  const lambCount = count - adultCount;

  const rows: unknown[][] = [];
  const meta: Omit<AnimalSeed, "id">[] = [];

  // Adultes (0.5 à 5 ans), sans parents connus
  for (let i = 0; i < adultCount; i++) {
    const breed = pick(BREEDS);
    const sex = chance(0.75) ? "FEMALE" : "MALE"; // troupeau féminin dominant, typique élevage ovin
    const ageMonths = randInt(10, 60);
    const birthDate = addMonths(NOW, -ageMonths);
    const baseW = breedBaseWeight(breed, sex);
    const weight = randFloat(baseW * 0.85, baseW * 1.15, 2);
    const bcs = randFloat(2.5, 4.0, 1);
    const healthStatus = chance(0.9) ? "HEALTHY" : pick(["SICK", "RECOVERING", "QUARANTINE"]);

    meta.push({ exploitationId, breed, sex, birthDate, fatherId: null, motherId: null, isFattening: false });
    rows.push([
      `${rfidPrefix}${String(i + 1).padStart(6, "0")}`,
      pick(SHEEP_NAMES),
      breed,
      sex,
      toSqlDate(birthDate),
      null,
      null,
      weight,
      bcs,
      healthStatus,
      null,
      exploitationId,
      toSqlDateTime(birthDate),
      toSqlDateTime(NOW),
      "ACTIVE",
    ]);
  }

  const adultIds = await bulkInsertReturningIds(
    conn,
    "animals",
    [
      "rfid", "name", "breed", "sex", "birth_date", "father_id", "mother_id",
      "weight", "bcs", "health_status", "photo_url", "exploitation_id",
      "created_at", "updated_at", "status",
    ],
    rows
  );
  const adults: AnimalSeed[] = adultIds.map((id, i) => ({ id, ...meta[i] }));

  const mothers = adults.filter((a) => a.sex === "FEMALE");
  const fathers = adults.filter((a) => a.sex === "MALE");

  // Agneaux (0 à 9 mois), avec parenté quand c'est possible
  const lambRows: unknown[][] = [];
  const lambMeta: Omit<AnimalSeed, "id">[] = [];
  for (let i = 0; i < lambCount; i++) {
    const breed = pick(BREEDS);
    const sex = chance(0.5) ? "FEMALE" : "MALE";
    const ageMonths = randInt(0, 9);
    const birthDate = addMonths(NOW, -ageMonths);
    const baseW = breedBaseWeight(breed, sex) * (ageMonths / 12); // croissance simplifiée
    const weight = randFloat(Math.max(3, baseW * 0.8), Math.max(5, baseW * 1.2), 2);
    const bcs = randFloat(2.5, 3.5, 1);
    const mother = mothers.length ? pick(mothers) : null;
    const father = fathers.length ? pick(fathers) : null;

    lambMeta.push({
      exploitationId, breed, sex, birthDate,
      fatherId: father?.id ?? null, motherId: mother?.id ?? null, isFattening: false,
    });
    lambRows.push([
      `${rfidPrefix}${String(adultCount + i + 1).padStart(6, "0")}`,
      pick(SHEEP_NAMES),
      breed,
      sex,
      toSqlDate(birthDate),
      father?.id ?? null,
      mother?.id ?? null,
      weight,
      bcs,
      chance(0.92) ? "HEALTHY" : pick(["SICK", "RECOVERING"]),
      null,
      exploitationId,
      toSqlDateTime(birthDate),
      toSqlDateTime(NOW),
      "ACTIVE",
    ]);
  }

  const lambIds = await bulkInsertReturningIds(
    conn,
    "animals",
    [
      "rfid", "name", "breed", "sex", "birth_date", "father_id", "mother_id",
      "weight", "bcs", "health_status", "photo_url", "exploitation_id",
      "created_at", "updated_at", "status",
    ],
    lambRows
  );
  const lambs: AnimalSeed[] = lambIds.map((id, i) => ({ id, ...lambMeta[i] }));

  return [...adults, ...lambs];
}

async function seedWeightAndBcsRecords(conn: PoolConnection, animals: AnimalSeed[]) {
  const weightRows: unknown[][] = [];
  const bcsRows: unknown[][] = [];

  for (const animal of animals) {
    const trackStart = animal.birthDate > HISTORY_START ? animal.birthDate : HISTORY_START;
    let cursor = new Date(trackStart);
    let currentWeight = breedBaseWeight(animal.breed, animal.sex) * randFloat(0.4, 0.6, 2);
    let currentBcs = randFloat(2.8, 3.6, 1);

    while (cursor < NOW) {
      const monthlyGain = animal.sex === "MALE" ? randFloat(0.8, 2.2, 2) : randFloat(0.5, 1.6, 2);
      currentWeight = Math.min(currentWeight + monthlyGain, breedBaseWeight(animal.breed, animal.sex) * 1.3);
      currentBcs = Math.min(4.5, Math.max(1.8, currentBcs + randFloat(-0.2, 0.2, 1)));

      weightRows.push([
        animal.id,
        currentWeight,
        currentBcs,
        toSqlDate(cursor),
        chance(0.15) ? "Pesée de contrôle mensuelle" : null,
        toSqlDateTime(cursor),
      ]);

      if (chance(0.4)) {
        bcsRows.push([
          animal.id,
          currentBcs,
          randFloat(currentBcs - 0.3, currentBcs + 0.3, 1),
          randFloat(currentBcs - 0.3, currentBcs + 0.3, 1),
          randFloat(currentBcs - 0.2, currentBcs + 0.3, 1),
          randFloat(currentBcs - 0.3, currentBcs + 0.2, 1),
          randFloat(currentBcs - 0.2, currentBcs + 0.2, 1),
          toSqlDate(cursor),
          pick(["Dr. Bennani (Vétérinaire)", "Jean Dupont (Éleveur)", "Fati (Éleveuse)"]),
          "Évaluation visuelle et palpation dorso-lombaire.",
          currentBcs < 2.8 ? "Augmenter l'apport énergétique de la ration." : "Maintenir la ration actuelle.",
          toSqlDateTime(cursor),
        ]);
      }
      cursor = addMonths(cursor, 1);
    }
  }

  const wCount = await bulkInsert(
    conn, "animal_weight_records",
    ["animal_id", "weight", "bcs", "date", "note", "created_at"],
    weightRows
  );
  const bCount = await bulkInsert(
    conn, "animal_bcs_records",
    [
      "animal_id", "bcs_score", "spinous_processes", "transverse_processes",
      "eye_muscle", "fat_cover", "tail_dock", "date", "evaluator", "notes",
      "nutritional_recommendation", "created_at",
    ],
    bcsRows
  );
  console.log(`  → ${wCount} pesées, ${bCount} évaluations BCS insérées`);
}

async function seedHealthAndVaccinations(conn: PoolConnection, animals: AnimalSeed[]) {
  const healthRows: unknown[][] = [];
  const vaccRows: unknown[][] = [];

  for (const animal of animals) {
    const trackStart = animal.birthDate > HISTORY_START ? animal.birthDate : HISTORY_START;
    const eventCount = randInt(1, 4);
    for (let i = 0; i < eventCount; i++) {
      const spanDays = Math.max(1, Math.floor((NOW.getTime() - trackStart.getTime()) / 86400000));
      const date = addDays(trackStart, randInt(0, spanDays));
      const category = pick(["HEALTH_CHECK", "HEALTH_CHECK", "TREATMENT", "ILLNESS"]);
      const status = category === "ILLNESS" ? pick(["ONGOING", "RECOVERING"]) : "COMPLETED";
      healthRows.push([
        animal.id,
        category,
        pick(HEALTH_TITLES[category]),
        category === "ILLNESS" ? "Signes cliniques observés lors de la ronde quotidienne." : "Examen standard, résultats consignés.",
        pick(["Dr. Bennani", "Dr. Martin", "Dr. Alaoui"]),
        category === "TREATMENT" ? pick(["Oxytétracycline", "Amoxicilline", "Ivermectine"]) : null,
        category === "TREATMENT" ? `${randInt(1, 10)} mg/kg/jour` : null,
        toSqlDate(date),
        status,
        toSqlDateTime(date),
      ]);
    }

    if (chance(0.8)) {
      const vaccCount = randInt(1, 2);
      for (let i = 0; i < vaccCount; i++) {
        const spanDays = Math.max(1, Math.floor((NOW.getTime() - trackStart.getTime()) / 86400000));
        const date = addDays(trackStart, randInt(0, spanDays));
        vaccRows.push([
          animal.id,
          pick(VACCINE_TYPES),
          `LOT-${randInt(1000, 9999)}`,
          toSqlDate(date),
          toSqlDate(addMonths(date, 6)),
          chance(0.85) ? "DONE" : pick(["PENDING", "OVERDUE"]),
          1,
          null,
          toSqlDateTime(date),
          toSqlDateTime(date),
        ]);
      }
    }
  }

  const hCount = await bulkInsert(
    conn, "animal_health_records",
    ["animal_id", "category", "title", "description", "veterinarian", "medication", "dosage", "date", "status", "created_at"],
    healthRows
  );
  const vCount = await bulkInsert(
    conn, "vaccinations",
    ["animal_id", "vaccine_type", "batch_number", "date", "booster_date", "status", "administered_by", "notes", "created_at", "updated_at"],
    vaccRows
  );
  console.log(`  → ${hCount} fiches sanitaires, ${vCount} vaccinations insérées`);
}

async function seedReproduction(conn: PoolConnection, animals: AnimalSeed[]) {
  const rows: unknown[][] = [];
  const females = animals.filter((a) => a.sex === "FEMALE");
  const males = animals.filter((a) => a.sex === "MALE");

  for (const female of females) {
    const ageMonthsNow = Math.floor((NOW.getTime() - female.birthDate.getTime()) / (30 * 86400000));
    if (ageMonthsNow < 8) continue; // pas encore en âge de se reproduire
    if (!chance(0.7)) continue;

    const cycles = randInt(1, 2);
    for (let c = 0; c < cycles; c++) {
      const cycleStart = addDays(HISTORY_START, randInt(0, SEED_CONFIG.MONTHS_OF_HISTORY * 28));
      if (cycleStart >= NOW) continue;

      const partner = males.length ? pick(males) : null;
      const type = chance(0.7) ? "NATUREL" : "IA";
      const pregnant = chance(0.75);

      rows.push([
        female.id, "BREEDING", toSqlDate(cycleStart), partner?.id ?? null,
        pregnant ? "Saillie réussie" : "Échec de saillie",
        `${type === "NATUREL" ? "Saillie naturelle" : "Insémination artificielle"} enregistrée.`,
        toSqlDateTime(cycleStart),
      ]);

      if (pregnant) {
        const confirmDate = addDays(cycleStart, 90);
        if (confirmDate < NOW) {
          rows.push([
            female.id, "PREGNANCY_CHECK", toSqlDate(confirmDate), null,
            "Gestation confirmée", "Échographie réalisée.", toSqlDateTime(confirmDate),
          ]);
        }
        const birthDate = addDays(cycleStart, 150);
        if (birthDate < NOW) {
          const liveBorn = pick([1, 1, 1, 2, 2, 3]);
          rows.push([
            female.id, "BIRTH", toSqlDate(birthDate), null,
            `${liveBorn} agneau(x) né(s) vivant(s)`,
            "Accouchement naturel, agneaux en bonne santé.", toSqlDateTime(birthDate),
          ]);
          const weaningDate = addDays(birthDate, 70);
          if (weaningDate < NOW) {
            rows.push([
              female.id, "WEANING", toSqlDate(weaningDate), null,
              `Séparation à ${70} jours`, "Sevrage réalisé sans complication.", toSqlDateTime(weaningDate),
            ]);
          }
        }
      }
    }
  }

  const count = await bulkInsert(
    conn, "animal_reproduction_records",
    ["animal_id", "event_type", "date", "partner_id", "result", "note", "created_at"],
    rows
  );
  console.log(`  → ${count} événements de reproduction insérés`);
}

async function seedMovements(conn: PoolConnection, animals: AnimalSeed[]) {
  const rows: unknown[][] = [];
  for (const animal of animals) {
    rows.push([
      animal.id, "ENTRY", toSqlDate(animal.birthDate),
      animal.motherId ? "Mise-bas sur exploitation" : "Achat / intégration au troupeau",
      animal.motherId ? "Sur place" : pick(["Marché aux moutons, Rabat", "Élevage partenaire, Fès", "Achat direct éleveur"]),
      animal.motherId ? null : randFloat(900, 3000, 2),
      toSqlDateTime(animal.birthDate),
    ]);

    if (chance(0.2)) {
      const exitDate = addDays(animal.birthDate, randInt(120, SEED_CONFIG.MONTHS_OF_HISTORY * 30));
      if (exitDate < NOW) {
        const isDeath = chance(0.15);
        rows.push([
          animal.id, isDeath ? "DEATH" : "SALE", toSqlDate(exitDate),
          isDeath ? "Décès (cause naturelle / maladie)" : "Vente à un client",
          isDeath ? "Sur place" : pick(["Boucherie des Cimes", "Marché aux moutons, Rabat"]),
          isDeath ? null : randFloat(1200, 3500, 2),
          toSqlDateTime(exitDate),
        ]);
      }
    }
  }
  const count = await bulkInsert(
    conn, "animal_movements",
    ["animal_id", "type", "date", "reason", "source_destination", "price", "created_at"],
    rows
  );
  console.log(`  → ${count} mouvements de troupeau insérés`);
}

// ============================================================
// GÉNÉRATION : ALIMENTATION
// ============================================================

async function getOrCreateFeedItems(conn: PoolConnection, exploitationId: number, isPrimary: boolean): Promise<number[]> {
  if (isPrimary) {
    const [rows] = await conn.query<any[]>("SELECT id FROM `feed_items` WHERE exploitation_id = ?", [exploitationId]);
    if (Array.isArray(rows) && rows.length > 0) return rows.map((r) => r.id);
  }
  const rows = FEED_ITEM_TEMPLATE.map((item) => [
    exploitationId, item.name, item.category, item.unit,
    randFloat(item.basePrice * 0.9, item.basePrice * 1.1, 2),
    randFloat(1500, 5000, 3),
    randFloat(300, 800, 3),
    pick(["Coopérative Agricole", "Provenderie Al Kabira", "Fournisseur Local"]),
    `${item.name} — stock exploitation`,
    null,
    toSqlDateTime(HISTORY_START),
    toSqlDateTime(NOW),
  ]);
  return bulkInsertReturningIds(
    conn, "feed_items",
    ["exploitation_id", "name", "category", "unit", "unit_price", "current_stock", "min_stock_threshold", "supplier", "description", "created_by", "created_at", "updated_at"],
    rows
  );
}

async function seedRationsForExploitation(conn: PoolConnection, exploitationId: number, feedItemIds: number[]): Promise<number[]> {
  const rationDefs = [
    { name: "Ration agneaux engraissement", code: "RATIO-ENG", target: "AGNELAUX", weight: 35, daily: 1.5 },
    { name: "Ration brebis allaitantes", code: "RATIO-LACT", target: "AGNELLES", weight: 60, daily: 2.0 },
    { name: "Ration béliers reproducteurs", code: "RATIO-BEL", target: "BELIERS", weight: 80, daily: 1.8 },
    { name: "Ration agneaux sevrage", code: "RATIO-SEV", target: "AGNEAUX_SEVRAGE", weight: 25, daily: 1.2 },
    { name: "Ration entretien adultes", code: "RATIO-ENTR", target: "TOUS", weight: 50, daily: 1.0 },
  ];
  const rows = rationDefs.map((r, i) => [
    exploitationId, r.name, `${r.code}-E${exploitationId}`, r.target, r.weight, r.daily,
    randFloat(1.2, 2.5, 2), `${r.name} — profil nutritionnel standard`, "ACTIVE", null,
    toSqlDateTime(HISTORY_START), toSqlDateTime(NOW),
  ]);
  const rationIds = await bulkInsertReturningIds(
    conn, "feed_rations",
    ["exploitation_id", "name", "code", "target_type", "target_weight_kg", "daily_ration_per_animal_kg", "cost_per_kg", "description", "status", "created_by", "created_at", "updated_at"],
    rows
  );

  const ratioRows: unknown[][] = [];
  for (const rationId of rationIds) {
    const chosenItems = [...feedItemIds].sort(() => Math.random() - 0.5).slice(0, 4);
    let remaining = 100;
    chosenItems.forEach((itemId, idx) => {
      const pct = idx === chosenItems.length - 1 ? remaining : randInt(10, Math.max(15, Math.floor(remaining / 2)));
      remaining -= pct;
      ratioRows.push([rationId, itemId, pct, pct * 10, toSqlDateTime(HISTORY_START), toSqlDateTime(NOW)]);
    });
  }
  await bulkInsert(
    conn, "feed_ration_items",
    ["ration_id", "feed_item_id", "percentage", "quantity_kg_per_ton", "created_at", "updated_at"],
    ratioRows
  );
  return rationIds;
}

async function seedFeedDistributionsAndStocks(
  conn: PoolConnection,
  exploitationId: number,
  rationIds: number[],
  feedItemIds: number[],
  batimentIds: number[],
  animalCount: number
) {
  const distRows: unknown[][] = [];
  let cursor = new Date(HISTORY_START);
  const weathers = ["BON", "BON", "BON", "CHAUD", "FROID", "SEC", "HUMIDE"];
  while (cursor < NOW) {
    for (const timeOfDay of ["MORNING", "EVENING"]) {
      const ration = pick(rationIds);
      const batiment = pick(batimentIds);
      const qty = randFloat(animalCount * 1.2, animalCount * 2.2, 2);
      distRows.push([
        ration, "BATIMENT", null, batiment, null,
        toSqlDate(cursor), timeOfDay, qty, animalCount,
        randFloat(0, qty * 0.05, 2), pick(weathers),
        "Distribution automatisée (seed)", 1,
        toSqlDateTime(cursor), toSqlDateTime(cursor),
      ]);
    }
    cursor = addDays(cursor, 7); // rythme hebdomadaire pour limiter le volume
  }
  const distCount = await bulkInsert(
    conn, "feed_distributions",
    [
      "ration_id", "target_type", "animal_id", "batiment_id", "batch_name",
      "distribution_date", "time_of_day", "quantity_distributed_kg", "number_of_animals",
      "refused_quantity_kg", "weather_conditions", "notes", "distributed_by",
      "created_at", "updated_at",
    ],
    distRows
  );

  const stockRows: unknown[][] = [];
  cursor = new Date(HISTORY_START);
  while (cursor < NOW) {
    for (const itemId of feedItemIds) {
      if (chance(0.5)) {
        stockRows.push([
          itemId, "IN", randFloat(300, 1500, 3), randFloat(1.5, 12, 2),
          toSqlDate(cursor), `LOT-${randInt(1000, 9999)}`, null,
          `APPRO-${cursor.getFullYear()}-${randInt(100, 999)}`, "Réapprovisionnement mensuel", 1,
          toSqlDateTime(cursor), toSqlDateTime(cursor),
        ]);
      }
      if (chance(0.7)) {
        stockRows.push([
          itemId, "OUT", randFloat(100, 600, 3), randFloat(1.5, 12, 2),
          toSqlDate(cursor), null, null,
          `CONSO-${cursor.getFullYear()}-${randInt(100, 999)}`, "Consommation mensuelle", 1,
          toSqlDateTime(cursor), toSqlDateTime(cursor),
        ]);
      }
    }
    cursor = addMonths(cursor, 1);
  }
  const stockCount = await bulkInsert(
    conn, "feed_stocks",
    [
      "feed_item_id", "movement_type", "quantity", "unit_price_at_time", "movement_date",
      "batch_number", "expiry_date", "reference", "notes", "recorded_by",
      "created_at", "updated_at",
    ],
    stockRows
  );
  console.log(`  → ${distCount} distributions, ${stockCount} mouvements de stock insérés`);
}

// ============================================================
// GÉNÉRATION : ENGRAISSEMENT
// ============================================================

async function seedFatteningForExploitation(
  conn: PoolConnection,
  exploitationId: number,
  animals: AnimalSeed[]
) {
  interface FatteningBatchDef {
    start: Date;
    end: Date;
    isCompleted: boolean;
    initialWeight: number;
    targetWeight: number;
    targetGmq: number;
    animalCount: number;
  }
  const batchDefs: FatteningBatchDef[] = [];
  for (let i = 0; i < SEED_CONFIG.FATTENING_BATCHES_PER_EXPLOITATION; i++) {
    const startOffsetMonths = randInt(1, SEED_CONFIG.MONTHS_OF_HISTORY - 3);
    const start = addMonths(HISTORY_START, startOffsetMonths);
    const durationMonths = randInt(3, 5);
    const end = addMonths(start, durationMonths);
    const isCompleted = end < NOW;
    const initialWeight = randFloat(28, 38, 2);
    const targetWeight = initialWeight + randFloat(8, 15, 2);
    const targetGmq = randFloat(0.1, 0.22, 2);
    batchDefs.push({ start, end, isCompleted, initialWeight, targetWeight, targetGmq, animalCount: randInt(15, 35) });
  }

  const batchRows = batchDefs.map((b, i) => [
    `Lot engraissement ${String.fromCharCode(65 + i)} - Exploitation ${exploitationId}`,
    toSqlDate(b.start), b.animalCount, b.initialWeight, b.targetWeight,
    toSqlDate(b.end), b.isCompleted ? "COMPLETED" : "ACTIVE",
    exploitationId, "Lot généré pour données BI", toSqlDateTime(b.start), toSqlDateTime(NOW), b.targetGmq,
  ]);
  const batchIds = await bulkInsertReturningIds(
    conn, "fattening_batches",
    [
      "name", "start_date", "animal_count", "initial_average_weight", "target_weight",
      "estimated_end_date", "status", "exploitation_id", "notes", "created_at", "updated_at", "target_daily_gmq",
    ],
    batchRows
  );

  const weightRows: unknown[][] = [];
  const individualRows: unknown[][] = [];
  const costRows: unknown[][] = [];
  const feedRows: unknown[][] = [];
  const alertRows: unknown[][] = [];

  const batchAnimals = animals.filter((a) => !a.isFattening).slice(0, batchIds.length * 5);

  batchIds.forEach((batchId, i) => {
    const def = batchDefs[i];
    const realEnd = def.isCompleted ? def.end : NOW;
    let cursor = new Date(def.start);
    let avgWeight = def.initialWeight;
    const actualGmq = def.targetGmq * randFloat(0.6, 1.15, 2); // parfois sous l'objectif -> alertes réalistes

    while (cursor <= realEnd) {
      const daysElapsed = Math.floor((cursor.getTime() - def.start.getTime()) / 86400000);
      avgWeight = def.initialWeight + actualGmq * daysElapsed;
      weightRows.push([batchId, Number(avgWeight.toFixed(2)), toSqlDate(cursor), "Pesée collective du lot", toSqlDateTime(cursor)]);
      cursor = addDays(cursor, 15);
    }

    const sampleAnimals = batchAnimals.slice(i * 5, i * 5 + 3);
    for (const animal of sampleAnimals) {
      let w = def.initialWeight + randFloat(-2, 2, 2);
      let d = new Date(def.start);
      while (d <= realEnd) {
        w += actualGmq * 15 + randFloat(-0.5, 0.5, 2);
        individualRows.push([batchId, animal.id, Number(w.toFixed(2)), toSqlDate(d), "Pesée individuelle échantillon", toSqlDateTime(d)]);
        d = addDays(d, 15);
      }
    }

    const costCategories = ["Vétérinaire", "Transport", "Main d'œuvre", "Eau", "Assurance"];
    for (let c = 0; c < randInt(3, 5); c++) {
      costRows.push([
        batchId, pick(costCategories), "Frais du lot", randFloat(60, 350, 2),
        toSqlDate(addDays(def.start, randInt(0, Math.max(1, daysBetween(def.start, realEnd))))),
        toSqlDateTime(def.start),
      ]);
    }

    let feedCursor = new Date(def.start);
    while (feedCursor <= realEnd) {
      const qty = randFloat(200, 500, 3);
      const price = randFloat(0.8, 0.95, 3);
      feedRows.push([
        batchId, toSqlDate(feedCursor), "Aliment concentré engrais", qty, price,
        Number((qty * price).toFixed(2)), "Achat périodique", toSqlDateTime(feedCursor),
      ]);
      feedCursor = addDays(feedCursor, 15);
    }

    if (actualGmq < def.targetGmq * 0.85) {
      alertRows.push([
        batchId, exploitationId, "LOW_GMQ", actualGmq < def.targetGmq * 0.7 ? "CRITICAL" : "WARNING",
        `Le GMQ du lot est en dessous de la cible de ${def.targetGmq} kg/jour.`,
        actualGmq.toFixed(3), def.targetGmq.toFixed(3), 0, null, toSqlDateTime(realEnd), toSqlDateTime(realEnd),
      ]);
    }
  });

  await bulkInsert(conn, "fattening_batch_weight_records", ["fattening_batch_id", "average_weight", "date", "note", "created_at"], weightRows);
  await bulkInsert(conn, "fattening_batch_individual_weights", ["fattening_batch_id", "animal_id", "weight", "date", "note", "created_at"], individualRows);
  await bulkInsert(conn, "fattening_batch_costs", ["fattening_batch_id", "category", "description", "amount", "date", "created_at"], costRows);
  await bulkInsert(conn, "fattening_feed_records", ["fattening_batch_id", "date", "feed_type", "quantity_kg", "unit_price", "total_cost", "note", "created_at"], feedRows);
  await bulkInsert(conn, "fattening_alerts", ["fattening_batch_id", "exploitation_id", "type", "severity", "message", "value", "threshold", "resolved", "resolved_at", "created_at", "updated_at"], alertRows);

  console.log(`  → ${batchIds.length} lots d'engraissement, ${weightRows.length} pesées de lot, ${costRows.length} coûts insérés`);
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

// ============================================================
// GÉNÉRATION : FINANCIER
// ============================================================

async function seedFinancials(conn: PoolConnection, exploitationId: number) {
  const budgetRows: unknown[][] = [];
  const expenseRows: unknown[][] = [];
  const revenueRows: unknown[][] = [];

  let cursor = new Date(HISTORY_START);
  while (cursor < NOW) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    for (const category of EXPENSE_CATEGORIES) {
      const planned = randFloat(300, 2200, 2);
      const variance = randFloat(-0.15, 0.15, 3);
      const actual = Number((planned * (1 + variance)).toFixed(2));
      budgetRows.push([
        exploitationId, year, month, category, planned, actual,
        `Budget ${category.toLowerCase()} ${month}/${year}`, 1, null,
        toSqlDateTime(cursor), toSqlDateTime(cursor),
      ]);
    }

    const expenseCount = randInt(4, 9);
    for (let i = 0; i < expenseCount; i++) {
      const category = pick(EXPENSE_CATEGORIES);
      const date = addDays(cursor, randInt(0, 27));
      if (date >= NOW) continue;
      expenseRows.push([
        exploitationId, toSqlDateTime(date), randFloat(40, 900, 2), category,
        pick(EXPENSE_BENEFICIARIES[category]), pick(PAYMENT_METHODS),
        chance(0.4) ? `https://storage.example.com/expense_${randInt(1000, 9999)}.jpg` : null,
        "Dépense générée pour données BI", 1, null,
        toSqlDateTime(date), toSqlDateTime(date),
      ]);
    }

    const revenueCount = randInt(2, 6);
    for (let i = 0; i < revenueCount; i++) {
      const type = pick(REVENUE_TYPES);
      const date = addDays(cursor, randInt(0, 27));
      if (date >= NOW) continue;
      const qty = type === "LAMB_SALE" ? randInt(4, 20) : type === "WOOL_SALE" ? randInt(10, 40) : randInt(1, 3);
      const unitPrice = type === "LAMB_SALE" ? randFloat(150, 200, 2) : type === "WOOL_SALE" ? randFloat(10, 14, 2) : randFloat(200, 550, 2);
      const totalHt = Number((qty * unitPrice).toFixed(2));
      const totalTtc = Number((totalHt * 1.1).toFixed(2));
      revenueRows.push([
        exploitationId, toSqlDateTime(date), type, qty, unitPrice, totalHt, totalTtc,
        type === "WOOL_SALE" ? pick(WOOL_BUYERS) : pick(LAMB_BUYERS),
        pick(PAYMENT_METHODS), chance(0.75) ? "COLLECTED" : "PENDING",
        "Vente générée pour données BI", 1, null,
        toSqlDateTime(date), toSqlDateTime(date),
      ]);
    }

    cursor = addMonths(cursor, 1);
  }

  const bCount = await bulkInsert(
    conn, "budgets",
    ["exploitation_id", "year", "month", "category", "planned_amount", "actual_amount", "notes", "created_by", "updated_by", "created_at", "updated_at"],
    budgetRows
  );
  const eCount = await bulkInsert(
    conn, "expenses",
    ["exploitation_id", "date", "amount", "category", "beneficiary", "payment_method", "justification", "notes", "created_by", "updated_by", "created_at", "updated_at"],
    expenseRows
  );
  const rCount = await bulkInsert(
    conn, "revenues",
    ["exploitation_id", "date", "type", "quantity", "unit_price", "total_ht", "total_ttc", "buyer", "payment_method", "status", "notes", "created_by", "updated_by", "created_at", "updated_at"],
    revenueRows
  );
  console.log(`  → ${bCount} lignes budget, ${eCount} dépenses, ${rCount} recettes insérées`);
}

// ============================================================
// ORCHESTRATION
// ============================================================

async function seedExploitation(conn: PoolConnection, exploitationId: number, rfidPrefix: string, isPrimary: boolean) {
  console.log(`\n=== Exploitation #${exploitationId} ===`);

  const animals = await seedAnimalsForExploitation(conn, exploitationId, rfidPrefix);
  console.log(`  → ${animals.length} animaux insérés`);

  await seedWeightAndBcsRecords(conn, animals);
  await seedHealthAndVaccinations(conn, animals);
  await seedReproduction(conn, animals);
  await seedMovements(conn, animals);

  const batimentMap = await seedBatiments(conn, [exploitationId]);
  const batimentIds = batimentMap.get(exploitationId)!;

  const feedItemIds = await getOrCreateFeedItems(conn, exploitationId, isPrimary);
  const rationIds = await seedRationsForExploitation(conn, exploitationId, feedItemIds);
  await seedFeedDistributionsAndStocks(conn, exploitationId, rationIds, feedItemIds, batimentIds, animals.length);

  await seedFatteningForExploitation(conn, exploitationId, animals);
  await seedFinancials(conn, exploitationId);
}

async function main() {
  const pool: Pool = mysql.createPool({ ...DB_CONFIG, waitForConnections: true, connectionLimit: 5 });
  const conn = await pool.getConnection();

  try {
    console.log("Connexion à la base établie. Démarrage du seed BI...");
    await conn.beginTransaction();

    const primaryId = await ensureBaseExploitation(conn);
    const extraIds = await seedExtraExploitations(conn);
    const allExploitationIds = [primaryId, ...extraIds];

    const basePrefixes = ["MA2026S", "MA2026T", "MA2026D"];
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const rfidPrefixes = basePrefixes.map((p) => `${p}${suffix}`);
    for (let i = 0; i < allExploitationIds.length; i++) {
      const isPrimary = allExploitationIds[i] === primaryId;
      await seedExploitation(conn, allExploitationIds[i], rfidPrefixes[i] ?? `MA2026X${suffix}`, isPrimary);
    }

    await conn.commit();
    console.log("\n✅ Seed BI terminé avec succès sur", allExploitationIds.length, "exploitation(s).");
  } catch (err) {
    await conn.rollback();
    console.error("❌ Erreur pendant le seed, rollback effectué :", err);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
