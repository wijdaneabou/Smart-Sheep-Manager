import { db } from "../db/connection.js";
import { permissions } from "../db/schema/permissions.js";
import { rolePermissions } from "../db/schema/rolePermissions.js";
import { eq } from "drizzle-orm";

/**
 * Get all permission names for a given role ID.
 * Returns an array of strings like ["USERS:CREATE", "USERS:READ", ...]
 */
export async function getPermissionNamesForRole(roleId: number): Promise<string[]> {
  const result = await db
    .select({
      name: permissions.name,
    })
    .from(rolePermissions)
    .innerJoin(
      permissions,
      eq(rolePermissions.permissionId, permissions.id)
    )
    .where(eq(rolePermissions.roleId, roleId));

  return result.map((row) => row.name);
}

export async function getAllPermissionNames(): Promise<string[]> {
  const result = await db
    .select({
      name: permissions.name,
    })
    .from(permissions);

  return result.map((row) => row.name);
}
