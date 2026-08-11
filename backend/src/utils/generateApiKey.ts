import crypto from "crypto";

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex"); // 64 caractères hexadécimaux
}