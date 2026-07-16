import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Veuillez saisir votre adresse email.")
    .email("Adresse email invalide."),

  password: z
    .string()
    .min(1, "Veuillez saisir votre mot de passe.")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});