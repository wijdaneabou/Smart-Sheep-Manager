import {
  getAllPermissionNames,
  getPermissionNamesForRole,
} from "../repositories/permissions.repository.js";

export function isAdminRole(roleId: number, roleName?: string | null): boolean {
  return roleId === 1 || roleName?.toUpperCase() === "ADMIN";
}

/**
 * Check if a role has a specific permission.
 * @param roleId - The role ID (e.g., 1 for ADMIN)
 * @param module - The module name (e.g., "USERS", "HERD", "HEALTH")
 * @param action - The action (e.g., "CREATE", "READ", "UPDATE", "DELETE")
 * @returns true if the role has the permission, false otherwise.
 */
export async function hasPermission(
  roleId: number,
  module: string,
  action: string
): Promise<boolean> {
  if (roleId === 1) {
    return true;
  }

  const permissionName = `${module}:${action}`;
  const permissions = await getPermissionNamesForRole(roleId);
  return permissions.includes(permissionName);
}

/**
 * Get all permission names for a role (useful for debugging or UI).
 */
export async function getPermissionsForRole(roleId: number): Promise<string[]> {
  if (roleId === 1) {
    return getAllPermissionNames();
  }

  return getPermissionNamesForRole(roleId);
}
