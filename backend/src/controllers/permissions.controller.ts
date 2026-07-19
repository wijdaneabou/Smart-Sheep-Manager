import type { Context } from "hono";
import { db } from "../db/connection.js";
import { roles } from "../db/schema/roles.js";
import { permissions } from "../db/schema/permissions.js";
import { rolePermissions } from "../db/schema/rolePermissions.js";
import { eq, and } from "drizzle-orm";

// GET /roles
export async function listRoles(c: Context) {
  const allRoles = await db.select().from(roles);
  return c.json(allRoles);
}

// GET /permissions
export async function listPermissions(c: Context) {
  const allPermissions = await db.select().from(permissions);
  return c.json(allPermissions);
}

// GET /permissions/roles/:roleId
export async function getRolePermissions(c: Context) {
  const roleId = Number(c.req.param("roleId"));
  if (isNaN(roleId)) return c.json({ error: "Invalid role ID" }, 400);

  const result = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  const permissionIds = result.map((r) => r.permissionId);
  return c.json({ roleId, permissionIds });
}

// PUT /permissions/roles/:roleId
export async function updateRolePermissions(c: Context) {
  const roleId = Number(c.req.param("roleId"));
  if (isNaN(roleId)) return c.json({ error: "Invalid role ID" }, 400);

  const body = await c.req.json();
  const { permissionIds } = body; // array of permission IDs

  if (!Array.isArray(permissionIds)) {
    return c.json({ error: "permissionIds must be an array" }, 400);
  }

  // Delete existing permissions for this role
  await db
    .delete(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  // Insert new ones
  if (permissionIds.length > 0) {
    const values = permissionIds.map((permId) => ({
      roleId,
      permissionId: permId,
    }));
    await db.insert(rolePermissions).values(values);
  }

  return c.json({ success: true, roleId, permissionIds });
}