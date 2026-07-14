import type { Context } from "hono";
import { login as loginService } from "../services/auth.service.js";
import { generateToken } from "../utils/jwt.js";

export async function login(c: Context) {
  const body = await c.req.json();

  const user = await loginService(
    body.email,
    body.password
  );

  if (!user) {
    return c.json(
      {
        success: false,
        message: "Email ou mot de passe incorrect",
      },
      401
    );
  }
  const token = generateToken(user.id, user.roleId);
  return c.json({
  success: true,
  message: "Connexion réussie",
  token,
  user: {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roleId: user.roleId,
  },
});
}