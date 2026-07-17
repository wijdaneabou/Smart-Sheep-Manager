import { findUserByEmail } from "../repositories/users.repository.js";

import {
  createResetCode,
  deleteUserCodes,
} from "../repositories/password-reset.repository.js";

import { sendPasswordResetEmail } from "./email.service.js";
import bcrypt from "bcrypt";

import {
  findValidCode,
  markCodeAsUsed,
} from "../repositories/password-reset.repository.js";

import {
  updatePassword,
} from "../repositories/users.repository.js";

import {
  deleteUserRefreshTokens,
} from "../repositories/refresh-token.repository.js";

export async function requestPasswordReset(
  email: string
) {
  // Rechercher l'utilisateur
  const user = await findUserByEmail(email);

  // Toujours retourner le même message
  if (!user) {
    return {
      success: true,
      message:
        "Si cet email existe, un code de réinitialisation sera envoyé.",
    };
  }

  // Supprimer les anciens codes
  await deleteUserCodes(user.id);

  // Générer un code à 6 chiffres
  const code = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // Expiration dans 10 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Sauvegarder le code
  await createResetCode(
    user.id,
    code,
    expiresAt
  );

  // Envoyer l'email
  await sendPasswordResetEmail(
    user.email,
    code
  );

  return {
    success: true,
    message:
      "Si cet email existe, un code de réinitialisation sera envoyé.",
  };
}

export async function resetPassword(
  code: string,
  password: string
) {
  // Vérifier le code
  const reset = await findValidCode(code);

  if (!reset) {
    return {
      success: false,
      message: "Code invalide ou expiré.",
    };
  }

  // Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  // Mettre à jour le mot de passe
  await updatePassword(
    reset.userId,
    hashedPassword
  );

  // Marquer le code comme utilisé
  await markCodeAsUsed(reset.id);

  // Déconnecter tous les appareils
  await deleteUserRefreshTokens(
    reset.userId
  );

  return {
    success: true,
    message:
      "Mot de passe modifié avec succès.",
  };
}
export async function verifyResetCode(
  code: string
) {
  const reset = await findValidCode(code);

  if (!reset) {
    return {
      success: false,
      message: "Code invalide ou expiré.",
    };
  }

  return {
    success: true,
    message: "Code valide.",
  };
}