import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.resolve("uploads/avatars");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function saveAvatarFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format d'image non supporte (jpeg, png, webp uniquement).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Le fichier depasse la taille maximale autorisee (5 Mo).");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const extension = file.type.split("/")[1];
  const fileName = `${randomUUID()}.${extension}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/avatars/${fileName}`;
}