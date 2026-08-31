import bcrypt from "bcrypt";

import {
  findUserByEmail,
  incrementFailedAttempts,
  resetFailedAttempts,
  lockUser,
  recordLogin,
} from "../repositories/users.repository.js";

type User = NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>;

export type LoginResult =
  | {
      success: true;
      status: 200;
      user: User;
    }
  | {
      success: false;
      status: 401 | 423;
      message: string;
    };

export async function login(
  email: string,
  password: string,
  ip: string | null = null,
  userAgent: string | null = null
): Promise<LoginResult> {
  const user = await findUserByEmail(email);

  // Utilisateur inexistant
  if (!user) {
    return {
      success: false,
      status: 401,
      message: "Email ou mot de passe incorrect.",
    };
  }

  // Compte verrouillé
  if (
    user.lockedUntil &&
    user.lockedUntil > new Date()
  ) {
    return {
      success: false,
      status: 423,
      message: "Votre compte est verrouillé pendant 15 minutes.",
    };
  }

  // Vérification du mot de passe
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    await incrementFailedAttempts(user.id);

    const failedAttempts = user.failedAttempts + 1;

    if (failedAttempts >= 5) {
      await lockUser(user.id);
      await recordLogin(user.id, ip, userAgent, false);
      return {
        success: false,
        status: 423,
        message:
          "Votre compte a été verrouillé pendant 15 minutes après 5 tentatives échouées.",
      };
    }

    await recordLogin(user.id, ip, userAgent, false);
    return {
      success: false,
      status: 401,
      message: `Email ou mot de passe incorrect. (${failedAttempts}/5 tentatives)`,
    };
  }

  // Réinitialiser le compteur
  await resetFailedAttempts(user.id);
  await recordLogin(user.id, ip, userAgent, true);

  return {
    success: true,
    status: 200,
    user,
  };
}