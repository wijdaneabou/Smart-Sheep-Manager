import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

import { findAnimalHistory } from "../repositories/animalHistory.repository.js";
import { findAnimalById as findAnimalByIdInAnimals } from "../repositories/animals.repository.js";
import type { HistoryEvent, HistoryFilters } from "../repositories/animalHistory.repository.js";

/**
 * Récupère l'historique complet d'un animal.
 */
export async function getAnimalHistory(
  animalId: number,
  filters: HistoryFilters
): Promise<{ success: true; status: 200; events: HistoryEvent[] } | { success: false; status: 404; message: string }> {
  const animal = await findAnimalByIdInAnimals(animalId);
  if (!animal) {
    return { success: false, status: 404, message: "Animal introuvable." };
  }

  const events = await findAnimalHistory(animalId, filters);
  return { success: true, status: 200, events };
}

/**
 * Génère un PDF de l'historique complet d'un animal.
 */
export async function exportAnimalHistoryPdf(
  animalId: number,
  filters: HistoryFilters
): Promise<Buffer | { error: string }> {
  const animal = await findAnimalByIdInAnimals(animalId);
  if (!animal) {
    return { error: "Animal introuvable." };
  }

  const events = await findAnimalHistory(animalId, filters);

  const doc = new PDFDocument({
    margin: 30,
    size: "A4",
  });

  const stream = new PassThrough();
  const buffers: Buffer[] = [];
  stream.on("data", (chunk) => buffers.push(chunk));
  doc.pipe(stream);

  // --- En-tête du document ---
  doc.fontSize(20).fillColor("#0F2A1D").text("Smart Sheep Manager", { align: "center" });
  doc.fontSize(14).fillColor("#333").text("Fiche d'historique animal", { align: "center" });
  doc.moveDown(0.5);

  // --- Informations de l'animal ---
  doc.fontSize(11).fillColor("#555");
  doc.text(`Animal : ${animal.name}`, { align: "left" });
  doc.text(`RFID : ${animal.rfid}`, { align: "left" });
  doc.text(`Race : ${animal.breed}`, { align: "left" });
  doc.text(`Sexe : ${animal.sex === "MALE" ? "Mâle" : "Femelle"}`, { align: "left" });
  doc.text(
    `Date de naissance : ${animal.birthDate ? new Date(animal.birthDate).toLocaleDateString("fr-FR") : "—"}`,
    { align: "left" }
  );
  doc.text(`Statut santé : ${animal.healthStatus}`, { align: "left" });
  doc.moveDown(1);

  // --- Filtre appliqué ---
  if (filters.category) {
    const categoryLabels: Record<string, string> = {
      health: "Santé",
      treatment: "Traitements",
      reproduction: "Reproduction",
      weight: "Poids",
    };
    doc.fontSize(10).fillColor("#666");
    doc.text(`Catégorie affichée : ${categoryLabels[filters.category] ?? filters.category}`, { align: "left" });
    doc.moveDown(0.5);
  }

  // --- Timeline ---
  doc.fontSize(13).fillColor("#0F2A1D").text("Chronologie des événements", { align: "left" });
  doc.moveDown(0.5);

  if (events.length === 0) {
    doc.fontSize(11).fillColor("#999").text("Aucun événement enregistré pour cet animal.", { align: "center" });
    doc.moveDown(2);
  } else {
    const categoryColors: Record<string, string> = {
      health: "#16a34a",
      treatment: "#2563eb",
      reproduction: "#7c3aed",
      weight: "#ea580c",
    };

    const categoryIcons: Record<string, string> = {
      health: "🩺",
      treatment: "💊",
      reproduction: "🔁",
      weight: "⚖️",
    };

    for (const event of events) {
      const color = categoryColors[event.category] ?? "#666";
      const icon = categoryIcons[event.category] ?? "📅";

      // Couleur de fond pour la catégorie
      doc.rect(doc.page.margins.left, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 1).fill(color);
      doc.moveDown(0.3);

      // En-tête de l'événement
      doc.fillColor(color).fontSize(10).font("Helvetica-Bold");
      doc.text(`${icon} ${event.category.toUpperCase()} — ${event.title}`, doc.page.margins.left + 4, doc.y + 4);

      // Date
      doc.fillColor("#666").fontSize(9).font("Helvetica");
      doc.text(`Date : ${new Date(event.date).toLocaleDateString("fr-FR")}`, doc.page.margins.left + 4, doc.y + 2);

      // Description
      if (event.description) {
        doc.fillColor("#333").fontSize(9).font("Helvetica");
        doc.text(`Description : ${event.description}`, doc.page.margins.left + 4, doc.y + 2, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 8 });
      }

      // Détails supplémentaires selon la catégorie
      doc.fillColor("#555").fontSize(8).font("Helvetica");
      const details: string[] = [];

      if (event.category === "health" || event.category === "treatment") {
        if (event.veterinarian) details.push(`Vétérinaire : ${event.veterinarian}`);
        if (event.medication) details.push(`Médicament : ${event.medication}`);
        if (event.dosage) details.push(`Dosage : ${event.dosage}`);
        if (event.status) details.push(`Statut : ${event.status}`);
      }

      if (event.category === "reproduction") {
        if (event.eventType) details.push(`Type : ${event.eventType}`);
        if (event.partnerId) details.push(`Partenaire (ID) : ${event.partnerId}`);
        if (event.result) details.push(`Résultat : ${event.result}`);
      }

      if (event.category === "weight") {
        if (event.weight) details.push(`Poids : ${event.weight} kg`);
        if (event.bcs) details.push(`BCS : ${event.bcs}`);
      }

      if (details.length > 0) {
        doc.text(details.join(" | "), doc.page.margins.left + 4, doc.y + 2, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 8 });
      }

      doc.moveDown(0.5);
    }
  }

  // --- Pied de page ---
  doc.fontSize(8).fillColor("#9ca3af");
  doc.text(
    `Généré le ${new Date().toLocaleString("fr-FR")} — ${events.length} événement(s)`,
    doc.page.margins.left,
    doc.y + 10
  );

  doc.end();

  return await new Promise<Buffer>((resolve) => {
    stream.on("end", () => resolve(Buffer.concat(buffers)));
  });
}
