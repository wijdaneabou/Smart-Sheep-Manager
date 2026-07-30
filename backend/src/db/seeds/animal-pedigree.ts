import "dotenv/config";
import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { eq } from "drizzle-orm";

/**
 * Seed data for the pedigree / genealogical tree feature (US-3.6).
 *
 * Creates a 3-generation pedigree with parent relationships, including
 * a consanguinity case (shared ancestor) to demonstrate the inbreeding
 * detection feature.
 *
 * Tree structure:
 *
 *   Gen 2:  [Atlas] [Sahara]   [Birka] [Luna]
 *             \     /            \     /
 *   Gen 1:    [Atlas Jr.]        [Birka Jr.]
 *                 \              /
 *   Gen 0:          [Birka III]  ← subject
 *
 * Consanguinity: Atlas (Gen 2) is the father of both Atlas Jr. and
 * Birka Jr., making him the paternal grandfather of the subject on
 * both sides → inbreeding loop.
 */
async function seedAnimalPedigree() {
  try {
    // ── Generation 2: Founders (grandparents) ──────────────────────────

    const founders = [
      {
        rfid: "MA2026000101",
        name: "Atlas",
        breed: "D'man" as const,
        sex: "MALE" as const,
        birthDate: "2020-03-15",
        weight: "95.00",
        bcs: "4.0",
        healthStatus: "HEALTHY" as const,
      },
      {
        rfid: "MA2026000102",
        name: "Sahara",
        breed: "Timahdite" as const,
        sex: "FEMALE" as const,
        birthDate: "2020-05-10",
        weight: "72.00",
        bcs: "3.5",
        healthStatus: "HEALTHY" as const,
      },
      {
        rfid: "MA2026000103",
        name: "Birka",
        breed: "Sardi" as const,
        sex: "FEMALE" as const,
        birthDate: "2021-01-20",
        weight: "78.00",
        bcs: "3.5",
        healthStatus: "HEALTHY" as const,
      },
      {
        rfid: "MA2026000104",
        name: "Luna",
        breed: "Beni-Guil" as const,
        sex: "FEMALE" as const,
        birthDate: "2021-04-05",
        weight: "70.00",
        bcs: "3.0",
        healthStatus: "HEALTHY" as const,
      },
    ];

    const founderIds: Record<string, number> = {};

    for (const founder of founders) {
      const existing = await db
        .select()
        .from(animals)
        .where(eq(animals.rfid, founder.rfid));

      if (existing.length > 0) {
        founderIds[founder.name] = existing[0].id;
        console.log(`ℹ️  Fondateur ${founder.name} (RFID: ${founder.rfid}) existe déjà (ID: ${existing[0].id}).`);
        continue;
      }

      const [result] = await db.insert(animals).values(founder as any).$returningId();
      founderIds[founder.name] = result.id;
      console.log(`✅ Fondateur créé : ${founder.name} (ID: ${result.id})`);
    }

    // ── Generation 1: Parents ───────────────────────────────────────────

    const parents = [
      {
        rfid: "MA2026000201",
        name: "Atlas Jr.",
        breed: "D'man" as const,
        sex: "MALE" as const,
        birthDate: "2022-06-12",
        weight: "85.00",
        bcs: "3.5",
        healthStatus: "HEALTHY" as const,
        fatherId: founderIds["Atlas"],
        motherId: founderIds["Sahara"],
      },
      {
        rfid: "MA2026000202",
        name: "Birka Jr.",
        breed: "Sardi" as const,
        sex: "FEMALE" as const,
        birthDate: "2022-08-20",
        weight: "76.00",
        bcs: "3.0",
        healthStatus: "HEALTHY" as const,
        fatherId: founderIds["Atlas"], // ← Consanguinity: Atlas is also the paternal grandfather
        motherId: founderIds["Birka"],
      },
    ];

    const parentIds: Record<string, number> = {};

    for (const parent of parents) {
      const existing = await db
        .select()
        .from(animals)
        .where(eq(animals.rfid, parent.rfid));

      if (existing.length > 0) {
        parentIds[parent.name] = existing[0].id;
        console.log(`ℹ️  Parent ${parent.name} (RFID: ${parent.rfid}) existe déjà (ID: ${existing[0].id}).`);
        continue;
      }

      const [result] = await db.insert(animals).values(parent as any).$returningId();
      parentIds[parent.name] = result.id;
      console.log(`✅ Parent créé : ${parent.name} (ID: ${result.id})`);
    }

    // ── Generation 0: Subject (with consanguinity) ─────────────────────

    const subjectRfid = "MA2026000301";
    const subjectName = "Birka III";

    const existingSubject = await db
      .select()
      .from(animals)
      .where(eq(animals.rfid, subjectRfid));

    if (existingSubject.length > 0) {
      console.log(`ℹ️  Sujet ${subjectName} (RFID: ${subjectRfid}) existe déjà (ID: ${existingSubject[0].id}).`);
    } else {
      const [result] = await db
        .insert(animals)
        .values({
          rfid: subjectRfid,
          name: subjectName,
          breed: "Sardi",
          sex: "FEMALE",
          birthDate: "2024-03-10",
          weight: "74.00",
          bcs: "3.5",
          healthStatus: "HEALTHY",
          fatherId: parentIds["Atlas Jr."],
          motherId: parentIds["Birka Jr."],
        } as any)
        .$returningId();
      console.log(`✅ Sujet créé : ${subjectName} (ID: ${result.id})`);
    }

    // ── Summary ─────────────────────────────────────────────────────────

    console.log("\n📊 Résumé de la seed pédigree :");
    console.log(`   - 4 fondateurs (génération 2)`);
    console.log(`   - 2 parents (génération 1)`);
    console.log(`   - 1 sujet (génération 0) : ${subjectName}`);
    console.log(`   - Consanguinité : Atlas (fondateur) est le père de Birka Jr.`);
    console.log(`     et le grand-père paternel du sujet → Boucle de consanguinité.`);
  } catch (error) {
    console.error("❌ Erreur lors de la seed pédigree :", error);
  } finally {
    process.exit(0);
  }
}

seedAnimalPedigree();
