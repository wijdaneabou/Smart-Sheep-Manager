import type { Context } from "hono";

import { login as loginService } from "../services/auth.service.js";
<<<<<<< Updated upstream

=======
import {
  requestPasswordReset,
  verifyResetCode as verifyResetCodeService,
  resetPassword as resetPasswordService,
} from "../services/password-reset.service.js";
>>>>>>> Stashed changes
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import { loginSchema } from "../validators/auth.validator.js";

import {
  saveRefreshToken,
  findRefreshToken,
} from "../repositories/refresh-token.repository.js";

export async function login(c: Context) {
  const body = await c.req.json();

  // Validation des données
  const validation = loginSchema.safeParse(body);

  if (!validation.success) {
    return c.json(
      {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      },
      400
    );
  }

  // Authentification
  const result = await loginService(
    validation.data.email,
    validation.data.password
  );

  // Mauvais mot de passe ou compte verrouillé
  if (result.success === false) {
    return c.json(
      {
        success: false,
        message: result.message,
      },
      {
        status: result.status,
      }
    );
  }

  // Ici TypeScript sait que user existe
  const user = result.user;

  // Génération des tokens
  const accessToken = generateAccessToken(
    user.id,
    user.roleId
  );

  const refreshToken = generateRefreshToken(
    user.id
  );

  // Expiration dans 7 jours
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Sauvegarde du Refresh Token
  await saveRefreshToken(
    user.id,
    refreshToken,
    expiresAt
  );

  return c.json({
    success: true,
    message: "Connexion réussie",

    accessToken,
    refreshToken,

    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
    },
  });
}

export async function refreshToken(c: Context) {
  const body = await c.req.json();

  const token = body.refreshToken;

  if (!token) {
    return c.json(
      {
        success: false,
        message: "Refresh Token manquant.",
      },
      400
    );
  }

  try {
    // Vérifier la signature du JWT
    const payload = verifyRefreshToken(token);

    // Vérifier qu'il existe en base
    const storedToken = await findRefreshToken(token);

    if (!storedToken) {
      return c.json(
        {
          success: false,
          message: "Refresh Token invalide.",
        },
        401
      );
    }

    // À remplacer plus tard par le vrai rôle récupéré en base
    const accessToken = generateAccessToken(
      payload.userId,
      1
    );

    return c.json({
      success: true,
      accessToken,
    });

  } catch {
    return c.json(
      {
        success: false,
        message: "Refresh Token expiré ou invalide.",
      },
      401
    );
  }
<<<<<<< Updated upstream
=======
}
export async function forgotPassword(c: any) {
  try {
    const { email } = await c.req.json();

    const result = await requestPasswordReset(email);

    return c.json(result);

  } catch (error) {
    console.error("Forgot password error :", error);

    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erreur serveur",
      },
      500
    );
  }
}
export async function resetPassword(c: Context) {
  try {
    const { code, password } = await c.req.json();

    if (!code || !password) {
      return c.json(
        {
          success: false,
          message: "Code et mot de passe sont obligatoires.",
        },
        400
      );
    }

    const result = await resetPasswordService(
      code,
      password
    );

    if (!result.success) {
      return c.json(result, 400);
    }

    return c.json(result);

  } catch (error) {
    console.error("Reset password error :", error);

    return c.json(
      {
        success: false,
        message: "Erreur serveur",
      },
      500
    );
  }
}
export async function verifyResetCode(c: Context) {
  try {
    const { code } = await c.req.json();

    const result = await verifyResetCodeService(code);

    return c.json(result);

  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Erreur serveur",
      },
      500
    );
  }
>>>>>>> Stashed changes
}