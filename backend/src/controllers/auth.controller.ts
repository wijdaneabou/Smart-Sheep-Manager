import type { Context } from "hono";
import { login as loginService } from "../services/auth.service.js";
import {
  requestPasswordReset,
  verifyResetCode as verifyResetCodeService,
  resetPassword as resetPasswordService,
} from "../services/password-reset.service.js";
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
import { findUserById } from "../repositories/users.repository.js";

import { createSession, closeSessionByRefreshToken } from "../repositories/sessions.repository.js";
import { auditService } from "../services/audit.service.js";

// 👇 Import nécessaire pour récupérer le nom du rôle ET exploitationId
import { db } from "../db/connection.js";
import { roles } from "../db/schema/roles.js";
import { userExploitations } from "../db/schema/userExploitations.js";
import { eq } from "drizzle-orm";

export async function login(c: Context) {
  const body = await c.req.json();

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

  const result = await loginService(
    validation.data.email,
    validation.data.password,
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      null,
    c.req.header("x-device-info") ??
      c.req.header("user-agent") ??
      null
  );

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

  const user = result.user;

  const accessToken = generateAccessToken(
    user.id,
    user.roleId
  );

  const refreshToken = generateRefreshToken(
    user.id
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await saveRefreshToken(
    user.id,
    refreshToken,
    expiresAt
  );

  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "UNKNOWN";

  const userAgent =
    c.req.header("x-device-info") ??
    c.req.header("user-agent") ??
    "UNKNOWN";

  await createSession({
    userId: user.id,
    refreshToken,
    ip,
    userAgent,
  });
  await auditService.log({
    userId: user.id,
    module: "Authentification",
    action: "LOGIN",
    description: "Connexion réussie",
    result: "SUCCESS",
    ip,
    userAgent,
  });

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

// =================================================================
// ✅ getMe – retourne l'utilisateur avec son roleName ET exploitationId
// =================================================================
export async function getMe(c: Context) {
  const userPayload = c.get("user") as
    | { id: number; roleId: number; roleName?: string | null }
    | undefined;

  if (!userPayload || !userPayload.id) {
    return c.json({ success: false, message: "Authentification requise." }, 401);
  }

  // Récupération complète de l'utilisateur
  const fullUser = await findUserById(userPayload.id);

  if (!fullUser) {
    return c.json({ success: false, message: "Utilisateur non trouvé." }, 404);
  }

  // Récupération du nom du rôle depuis la base
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, fullUser.roleId),
  });

  // ✅ Récupération de l'exploitationId depuis user_exploitations
  const userExploitation = await db.query.userExploitations.findFirst({
    where: eq(userExploitations.userId, fullUser.id),
  });

  const { password, ...safeUser } = fullUser;

  // ✅ Ajout de roleName et exploitationId
  return c.json({
    ...safeUser,
    roleName: role?.name ?? null,
    exploitationId: userExploitation?.exploitationId ?? null,
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
    const payload = verifyRefreshToken(token);

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

    const fullUser = await findUserById(payload.userId);

    if (!fullUser) {
      return c.json(
        {
          success: false,
          message: "Utilisateur non trouvé.",
        },
        404
      );
    }

    const accessToken = generateAccessToken(
      fullUser.id,
      fullUser.roleId
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

    const result = await resetPasswordService(code, password);

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
}

export async function logout(c: Context) {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json(
        {
          success: false,
          message: "Refresh Token manquant.",
        },
        400
      );
    }

    await closeSessionByRefreshToken(refreshToken);
    const user = c.get("user") as { id: number } | undefined;

    await auditService.log({
      userId: user?.id,
      module: "Authentification",
      action: "LOGOUT",
      description: "Déconnexion",
      result: "SUCCESS",
    });

    return c.json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("Logout error :", error);
    return c.json(
      {
        success: false,
        message: "Erreur serveur",
      },
      500
    );
  }
}