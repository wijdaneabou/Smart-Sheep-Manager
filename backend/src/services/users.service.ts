import bcrypt from "bcrypt";
import {
  findUserById,
  findUserByEmail,
  createUser as createUserInDb,
  updateUser as updateUserInDb,
  setUserStatus,
  listUsers as listUsersInDb,
  getLoginHistory as getLoginHistoryInDb,
} from "../repositories/users.repository.js";
import { db } from "../db/connection.js";
import { userExploitations } from "../db/schema/userExploitations.js";
import { exploitations } from "../db/schema/exploitations.js";
import { animals } from "../db/schema/animals.js";
import { eq, count, sql, inArray } from "drizzle-orm";

const SALT_ROUNDS = 12;

function sanitizeUser<T extends { password?: string } | null>(user: T) {
  if (!user) return null;
  const { password, ...safeUser } = user as Record<string, unknown>;
  return safeUser;
}

type SanitizedUser = ReturnType<typeof sanitizeUser>;

export type CreateUserResult =
  | { success: true; status: 201; user: SanitizedUser }
  | { success: false; status: 409; message: string };

export async function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  roleId: number;
}): Promise<CreateUserResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    return {
      success: false,
      status: 409,
      message: "Un utilisateur avec cet email existe deja.",
    };
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await createUserInDb({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    password: hashedPassword,
    roleId: input.roleId,
  });

  return { success: true, status: 201, user: sanitizeUser(user) };
}

export type UpdateUserResult =
  | { success: true; status: 200; user: SanitizedUser }
  | { success: false; status: 404 | 409; message: string };

export async function updateUser(
  id: number,
  input: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    roleId?: number;
  }
): Promise<UpdateUserResult> {
  const existing = await findUserById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Utilisateur introuvable." };
  }

  if (input.email && input.email !== existing.email) {
    const emailTaken = await findUserByEmail(input.email);
    if (emailTaken) {
      return {
        success: false,
        status: 409,
        message: "Cet email est deja utilise par un autre compte.",
      };
    }
  }

  const updated = await updateUserInDb(id, input);
  return { success: true, status: 200, user: sanitizeUser(updated) };
}

export type StatusChangeResult =
  | { success: true; status: 200; user: SanitizedUser }
  | { success: false; status: 404 | 400; message: string };

export async function deactivateUser(id: number): Promise<StatusChangeResult> {
  const existing = await findUserById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Utilisateur introuvable." };
  }
  if (existing.status === "INACTIVE") {
    return { success: false, status: 400, message: "Ce compte est deja desactive." };
  }
  const updated = await setUserStatus(id, "INACTIVE");
  return { success: true, status: 200, user: sanitizeUser(updated) };
}

export async function reactivateUser(id: number): Promise<StatusChangeResult> {
  const existing = await findUserById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Utilisateur introuvable." };
  }
  const updated = await setUserStatus(id, "ACTIVE");
  return { success: true, status: 200, user: sanitizeUser(updated) };
}

export type GetUserResult =
  | { success: true; status: 200; user: SanitizedUser }
  | { success: false; status: 404; message: string };

export async function getUserById(id: number): Promise<GetUserResult> {
  const user = await findUserById(id);
  if (!user) {
    return { success: false, status: 404, message: "Utilisateur introuvable." };
  }
  return { success: true, status: 200, user: sanitizeUser(user) };
}

export async function listUsers(params: {
  page: number;
  limit: number;
  search?: string;
  roleId?: number;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  exploitationId?: number;
}) {
  const { rows, total } = await listUsersInDb(params);
  return {
    success: true as const,
    status: 200 as const,
    users: rows.map(sanitizeUser),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function updatePhoto(
  id: number,
  photoPath: string
): Promise<StatusChangeResult> {
  const existing = await findUserById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Utilisateur introuvable." };
  }
  const updated = await updateUserInDb(id, { photo: photoPath });
  return { success: true, status: 200, user: sanitizeUser(updated) };
}

export type LoginHistoryResult =
  | {
      success: true;
      status: 200;
      history: unknown[];
      pagination: { total: number; page: number; limit: number };
    }
  | { success: false; status: 404; message: string };

export async function getLoginHistory(
  userId: number,
  page: number,
  limit: number
): Promise<LoginHistoryResult> {
  const existing = await findUserById(userId);
  if (!existing) {
    return { success: false, status: 404, message: "Utilisateur introuvable." };
  }
  const { rows, total } = await getLoginHistoryInDb(userId, page, limit);
  return { success: true, status: 200, history: rows, pagination: { total, page, limit } };
}

export type UserExploitationSummary = {
  id: number;
  name: string;
  type: string;
  role: string;
  animalsCount: number;
  superficie: string | null;
};

export type UserAdminDetailsResult =
  | {
      success: true;
      status: 200;
      user: SanitizedUser;
      exploitations: UserExploitationSummary[];
      totalExploitations: number;
      totalAnimals: number;
    }
  | { success: false; status: 404 | 500; message: string };

export async function getUserAdminDetails(userId: number): Promise<UserAdminDetailsResult> {
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, status: 404, message: "Utilisateur introuvable." };
  }

  const linkedExploitations = await db
    .select({
      exploitationId: userExploitations.exploitationId,
      role: userExploitations.role,
      name: exploitations.name,
      type: exploitations.type,
      superficie: exploitations.superficie,
    })
    .from(userExploitations)
    .leftJoin(exploitations, eq(userExploitations.exploitationId, exploitations.id))
    .where(eq(userExploitations.userId, userId));

  const ownedExploitations = await db
    .select({
      id: exploitations.id,
      name: exploitations.name,
      type: exploitations.type,
      superficie: exploitations.superficie,
    })
    .from(exploitations)
    .where(eq(exploitations.ownerId, userId));

  const linkedIds = new Set(
    linkedExploitations
      .map((ue) => ue.exploitationId)
      .filter((id): id is number => id != null)
  );

  const ownedNotLinked = ownedExploitations.filter(
    (exp) => !linkedIds.has(exp.id)
  );

  const userExploitationsList = [
    ...linkedExploitations,
    ...ownedNotLinked.map((exp) => ({
      exploitationId: exp.id,
      role: "OWNER" as const,
      name: exp.name,
      type: exp.type,
      superficie: exp.superficie,
    })),
  ];

  const exploitationIds = userExploitationsList
    .map((ue) => ue.exploitationId)
    .filter((id): id is number => id != null);

  let animalsCountByExploitation: Record<number, number> = {};

  if (exploitationIds.length > 0) {
    const counts = await db
      .select({
        exploitationId: animals.exploitationId,
        count: count(),
      })
      .from(animals)
      .where(inArray(animals.exploitationId, exploitationIds))
      .groupBy(animals.exploitationId);

    counts.forEach((row) => {
      if (row.exploitationId != null) {
        animalsCountByExploitation[row.exploitationId] = Number(row.count);
      }
    });
  }

  const exploitationsSummary: UserExploitationSummary[] = userExploitationsList.map(
    (ue) => ({
      id: ue.exploitationId,
      name: ue.name || "Exploitation inconnue",
      type: ue.type || "OVIN",
      role: ue.role,
      animalsCount: animalsCountByExploitation[ue.exploitationId] || 0,
      superficie: ue.superficie,
    })
  );

  const totalAnimals = Object.values(animalsCountByExploitation).reduce(
    (sum, c) => sum + c,
    0
  );

  return {
    success: true,
    status: 200,
    user: sanitizeUser(user),
    exploitations: exploitationsSummary,
    totalExploitations: exploitationsSummary.length,
    totalAnimals,
  };
}