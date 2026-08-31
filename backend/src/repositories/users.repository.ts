import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";
import { loginHistory } from "../db/schema/loginHistory.js";
import { userExploitations } from "../db/schema/userExploitations.js";
import { eq, and, or, like, desc, count, inArray } from "drizzle-orm";

// ─────────────────────────────────────────────
// Fonctions existantes (US-1.1 - authentification)
// ─────────────────────────────────────────────

export async function incrementFailedAttempts(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return;

  await db
    .update(users)
    .set({
      failedAttempts: user.failedAttempts + 1,
    })
    .where(eq(users.id, userId));
}

export async function resetFailedAttempts(userId: number) {
  await db
    .update(users)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function lockUser(userId: number) {
  const lockUntil = new Date();
  lockUntil.setMinutes(lockUntil.getMinutes() + 15);

  await db
    .update(users)
    .set({
      failedAttempts: 5,
      lockedUntil: lockUntil,
    })
    .where(eq(users.id, userId));
}

export async function findUserByEmail(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  return user ?? null;
}

export async function updatePassword(userId: number, hashedPassword: string) {
  return db
    .update(users)
    .set({
      password: hashedPassword,
    })
    .where(eq(users.id, userId));
}

export async function findUserById(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user ?? null;
}

// ─────────────────────────────────────────────
// NOUVEAU (US-1.2 - gestion des profils utilisateurs)
// ─────────────────────────────────────────────

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type CreateUserData = typeof users.$inferInsert;
type UpdateUserData = Partial<CreateUserData>;

export async function createUser(data: CreateUserData) {
  const [result] = await db.insert(users).values(data).$returningId();
  return findUserById(result.id);
}

export async function updateUser(userId: number, data: UpdateUserData) {
  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return findUserById(userId);
}

export async function setUserStatus(userId: number, status: UserStatus) {
  await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return findUserById(userId);
}

export async function listUsers(params: {
  page: number;
  limit: number;
  search?: string;
  roleId?: number;
  status?: UserStatus;
  exploitationId?: number;
}) {
  const conditions = [];

  if (params.search) {
    const term = `%${params.search}%`;
    conditions.push(
      or(
        like(users.firstName, term),
        like(users.lastName, term),
        like(users.email, term)
      )
    );
  }
  if (params.roleId) conditions.push(eq(users.roleId, params.roleId));
  if (params.status) conditions.push(eq(users.status, params.status));
  if (params.exploitationId) {
    const subquery = db
      .select({ userId: userExploitations.userId })
      .from(userExploitations)
      .where(eq(userExploitations.exploitationId, params.exploitationId));
    conditions.push(inArray(users.id, subquery));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(users)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(users.createdAt));

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(whereClause);

  return { rows, total };
}

/**
 * A appeler depuis login() (auth.service.ts) a chaque tentative de
 * connexion, reussie ou non, pour alimenter l'historique (US-1.2).
 */
export async function recordLogin(
  userId: number,
  ip: string | null,
  userAgent: string | null,
  success: boolean
) {
  await db.insert(loginHistory).values({
    userId,
    ip: ip ?? undefined,
    userAgent: userAgent ?? undefined,
    success,
  });
}

export async function getLoginHistory(
  userId: number,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(loginHistory)
    .where(eq(loginHistory.userId, userId))
    .orderBy(desc(loginHistory.loginAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(loginHistory)
    .where(eq(loginHistory.userId, userId));

  return { rows, total };
}