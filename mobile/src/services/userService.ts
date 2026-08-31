import api from "./api";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  roleId: number;
  exploitationId?: number | null;
  status: UserStatus;
  createdAt: string;
  roleName?: string | null;
};

export type LoginHistoryEntry = {
  id: number;
  userId: number;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  loginAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

export type UserExploitationSummary = {
  id: number;
  name: string;
  type: string;
  role: string;
  animalsCount: number;
  superficie: string | null;
};

export type UserAdminDetails = {
  user: User;
  exploitations: UserExploitationSummary[];
  totalExploitations: number;
  totalAnimals: number;
};

function extractError(err: any): string {
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  return err?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

export async function listUsers(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: number;
    status?: UserStatus;
    exploitationId?: number;
  } = {}
) {
  try {
    const response = await api.get<{ data: User[]; pagination: Pagination }>(
      "/users",
      { params }
    );
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getUserAdminDetails(id: number) {
  try {
    const response = await api.get<{ data: UserAdminDetails }>(`/users/${id}/admin-details`);
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getUserById(id: number) {
  try {
    const response = await api.get<{ data: User }>(`/users/${id}`);
    return { success: true as const, user: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  roleId: number;
  exploitationId?: number;
}) {
  try {
    const response = await api.post<{ data: User }>("/users", input);
    return { success: true as const, user: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function updateUser(
  id: number,
  input: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleId: number;
    exploitationId: number;
  }>
) {
  try {
    const response = await api.put<{ data: User }>(`/users/${id}`, input);
    return { success: true as const, user: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deactivateUser(id: number) {
  try {
    const response = await api.patch<{ data: User }>(`/users/${id}/deactivate`);
    return { success: true as const, user: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function reactivateUser(id: number) {
  try {
    const response = await api.patch<{ data: User }>(`/users/${id}/reactivate`);
    return { success: true as const, user: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

/**
 * Upload de la photo de profil.
 * imageUri vient generalement de expo-image-picker (result.assets[0].uri).
 */
export async function uploadUserPhoto(id: number, imageUri: string) {
  try {
    const filename = imageUri.split("/").pop() ?? "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = (match?.[1] ?? "jpg").toLowerCase();
    const mimeType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    const formData = new FormData();
    // @ts-expect-error : format specifique React Native pour FormData
    formData.append("photo", { uri: imageUri, name: filename, type: mimeType });

    const response = await api.post<{ data: User }>(
      `/users/${id}/photo`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000, // upload d'image : plus long que le timeout par defaut (10s)
      }
    );
    return { success: true as const, user: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getLoginHistory(userId: number, page = 1, limit = 20) {
  try {
    const response = await api.get<{
      data: LoginHistoryEntry[];
      pagination: Pagination;
    }>(`/users/${userId}/login-history`, { params: { page, limit } });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}