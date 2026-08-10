import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// ─── Constantes ────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

// ─── Fonction générique ──────────────────────────────────────

/**
 * Sauvegarde un fichier image dans le sous-dossier spécifié.
 * Vérifie le type MIME, la taille, génère un nom unique.
 * Retourne le chemin d'accès public (ex: /uploads/exploitations/uuid.jpg)
 */
async function saveImageFile(file: File, subfolder: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format d'image non supporté (jpeg, png, webp uniquement).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Le fichier dépasse la taille maximale autorisée (5 Mo).");
  }

  const uploadDir = path.resolve(`uploads/${subfolder}`);
  await mkdir(uploadDir, { recursive: true });

  const extension = file.type.split("/")[1];
  const fileName = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Retourne le chemin public
  return `/uploads/${subfolder}/${fileName}`;
}

// ─── Fonctions spécifiques ──────────────────────────────────

/**
 * Sauvegarde un avatar d'utilisateur.
 */
export async function saveAvatarFile(file: File): Promise<string> {
  return saveImageFile(file, "avatars");
}

/**
 * Sauvegarde une photo d'exploitation.
 */
export async function saveExploitationPhoto(file: File): Promise<string> {
  return saveImageFile(file, "exploitations");
}

/**
 * Sauvegarde une photo d'animal.
 */
export async function saveAnimalPhoto(file: File): Promise<string> {
  return saveImageFile(file, "animals");
}

/**
 * Sauvegarde une photo de bâtiment / parcelle (si utilisé).
 */
export async function saveBatimentPhoto(file: File): Promise<string> {
  return saveImageFile(file, "batiments");
}