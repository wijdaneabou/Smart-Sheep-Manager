import { db } from "../db/connection.js";
import { userSessions, users } from "../db/schema/index.js";
import { eq, and, desc, like, or, SQL } from "drizzle-orm";

export async function createSession(data: {
  userId: number;
  refreshToken: string;
  ip: string;
  userAgent: string;
}) {
  return db.insert(userSessions).values({
    userId: data.userId,
    refreshToken: data.refreshToken,
    ip: data.ip,
    userAgent: data.userAgent,
  });
}

// Ferme une session précise via son refreshToken
export async function closeSessionByRefreshToken(refreshToken: string) {
  return db
    .update(userSessions)
    .set({
      isActive: false,
      logoutAt: new Date(),
    })
    .where(eq(userSessions.refreshToken, refreshToken));
}

// Ferme toutes les sessions actives d'un utilisateur (logout global)
export async function closeAllUserSessions(userId: number) {
  return db
    .update(userSessions)
    .set({
      isActive: false,
      logoutAt: new Date(),
    })
    .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, true)));
}

const selectFields = {
  id: userSessions.id,
  userId: userSessions.userId,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  ip: userSessions.ip,
  userAgent: userSessions.userAgent,
  loginAt: userSessions.loginAt,
  logoutAt: userSessions.logoutAt,
  isActive: userSessions.isActive,
};

function buildWhere(search?: string): SQL | undefined {
  if (!search) return undefined;
  const term = `%${search}%`;
  return or(
    like(userSessions.ip, term),
    like(userSessions.userAgent, term),
    like(users.firstName, term),
    like(users.lastName, term),
    like(users.email, term)
  )!;
}

// ✅ nouveau : liste paginée des sessions (utilisée par la route GET /sessions)
export async function findAllSessions(page = 1, limit = 20, search?: string) {
  const where = buildWhere(search);

  return db
    .select(selectFields)
    .from(userSessions)
    .leftJoin(users, eq(userSessions.userId, users.id))
    .where(where)
    .orderBy(desc(userSessions.loginAt))
    .limit(limit)
    .offset((page - 1) * limit);
}
