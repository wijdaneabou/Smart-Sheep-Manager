import api from "./api";

export interface Permission {
  id: number;
  name: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export const permissionsApi = {
  // Get all permissions (list of modules and actions)
  getAll: () => api.get<Permission[]>("/permissions"),

  // Get permissions for a specific role
  getByRole: (roleId: number) =>
    api.get<{ roleId: number; permissions: string[] }>(`/permissions/roles/${roleId}`),
  getRoles: () => api.get<Role[]>("/permissions/roles"),

  // Update permissions for a role (send list of permission IDs)
  update: (roleId: number, permissionIds: number[]) =>
    api.put(`/permissions/roles/${roleId}`, { permissionIds }),
};