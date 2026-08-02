import { db } from '../../db/connection.js';
import { animals } from '../../db/schema/animals.js';
import { reproductionCycles } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

async function seedReproductionCycles() {
  console.log('🌱 Démarrage du seed des cycles de reproduction...');

  // Récupérer toutes les femelles
  const females = await db
    .select()
    .from(animals)
    .where(eq(animals.sex, 'FEMALE'));

  if (females.length === 0) {
    console.log('⚠️ Aucune femelle trouvée. Exécutez d’abord seed:animal-history.');
    return;
  }

  console.log(`🐑 ${females.length} femelles trouvées.`);

  // Récupérer les mâles
  const males = await db
    .select()
    .from(animals)
    .where(eq(animals.sex, 'MALE'));

  const maleIds = males.map((m) => m.id);

  for (const female of females) {
    const randomMale = maleIds.length > 0 ? maleIds[Math.floor(Math.random() * maleIds.length)] : null;

    // ✅ Utilisation de camelCase (animalId, heatDate, etc.)
    await db.insert(reproductionCycles).values({
      animalId: female.id,
      heatDate: new Date('2026-07-15'),
      matingType: 'natural',
      maleId: randomMale,
      pregnancyConfirmed: true,
      confirmationDate: new Date('2026-08-10'),
      notes: 'Cycle naturel - confirmé',
      createdBy: 1, // Admin (créé par seed:admin)
    });

    await db.insert(reproductionCycles).values({
      animalId: female.id,
      heatDate: new Date('2026-06-01'),
      matingType: 'ai',
      semenReference: `SEM-${Math.floor(Math.random() * 10000)}`,
      pregnancyConfirmed: false,
      notes: 'Insémination artificielle - en attente',
      createdBy: 1,
    });

    console.log(`✅ 2 cycles créés pour femelle ${female.name} (ID: ${female.id})`);
  }

  console.log('🎉 Seed des cycles de reproduction terminé.');
}

seedReproductionCycles().catch((error) => {
  console.error('❌ Erreur lors du seed:', error);
  process.exit(1);
});