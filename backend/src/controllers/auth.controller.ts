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
import { getPermissionsForRole } from "../services/permissions.service.js";
import { loginSchema } from "../validators/auth.validator.js";
import {
  saveRefreshToken,
  findRefreshToken,
} from "../repositories/refresh-token.repository.js";
import { findUserById } from "../repositories/users.repository.js";

import { createSession, closeSessionByRefreshToken } from "../repositories/sessions.repository.js";
import { auditService } from "../services/audit.service.js";

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
    validation.data.password
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

  // Enregistrement de la session (device, IP, user-agent)
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "UNKNOWN";

  // On privilégie le header custom envoyé par le mobile (X-Device-Info),
  // qui contient des infos lisibles (OS, marque, modèle) plutôt que le
  // User-Agent brut du client HTTP (ex: "okhttp/4.12.0")
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

export async function getMe(c: Context) {
  const user = c.get("user") as
    | { id: number; roleId: number; roleName?: string | null }
    | undefined;

  if (!user) {
    return c.json({ success: false, message: "Authentification requise." }, 401);
  }

  try {
    const fullUser = await findUserById(user.id);

    if (!fullUser) {
      return c.json({ success: false, message: "Utilisateur non trouvé." }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: fullUser.id,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        email: fullUser.email,
        phone: fullUser.phone,
        photo: fullUser.photo,
        roleId: fullUser.roleId,
        roleName: user.roleName ?? null,
        status: fullUser.status,
        createdAt: fullUser.createdAt,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return c.json({ success: false, message: "Erreur serveur." }, 500);
  }
}

export async function getMyPermissions(c: Context) {
  const user = c.get("user") as
    | { id: number; roleId: number; roleName?: string | null }
    | undefined;

  if (!user) {
    return c.json({ success: false, message: "Authentification requise." }, 401);
  }

  const permissions = await getPermissionsForRole(user.roleId);

  return c.json({
    permissions,
    roleName: user.roleName ?? null,
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