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
  exploitationId?: number;
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
    exploitationId: input.exploitationId,
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
    exploitationId?: number;
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
  exploitationId?: number;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
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