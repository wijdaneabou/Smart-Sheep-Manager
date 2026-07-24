import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

async function saveImageFile(file: File, subfolder: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format d'image non supporte (jpeg, png, webp uniquement).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Le fichier depasse la taille maximale autorisee (5 Mo).");
  }

  const uploadDir = path.resolve(`uploads/${subfolder}`);
  await mkdir(uploadDir, { recursive: true });

  const extension = file.type.split("/")[1];
  const fileName = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // TODO : remplacer par un upload vers AWS S3 / MinIO en production
  // (section 3.5 du cahier des charges). Seule cette fonction changerait.
  return `/uploads/${subfolder}/${fileName}`;
}

export async function saveAvatarFile(file: File): Promise<string> {
  return saveImageFile(file, "avatars");
}

export async function saveExploitationPhoto(file: File): Promise<string> {
  return saveImageFile(file, "exploitations");
}