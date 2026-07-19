import { db } from "../connection.js";
import { roles } from "../schema/roles.js";
import { permissions } from "../schema/permissions.js";
import { rolePermissions } from "../schema/rolePermissions.js";
import { and, eq } from "drizzle-orm";

// Define which permissions each role gets (using permission names)
const rolePermissionMap: Record<string, string[]> = {
  ADMIN: [
    "USERS:CREATE", "USERS:READ", "USERS:UPDATE", "USERS:DELETE",
    "EXPLOITATIONS:CREATE", "EXPLOITATIONS:READ", "EXPLOITATIONS:UPDATE", "EXPLOITATIONS:DELETE",
    "HERD:CREATE", "HERD:READ", "HERD:UPDATE", "HERD:DELETE",
    "IOT:CREATE", "IOT:READ", "IOT:UPDATE", "IOT:DELETE",
    "HEALTH:CREATE", "HEALTH:READ", "HEALTH:UPDATE", "HEALTH:DELETE",
    "REPRODUCTION:CREATE", "REPRODUCTION:READ", "REPRODUCTION:UPDATE", "REPRODUCTION:DELETE",
    "FEEDING:CREATE", "FEEDING:READ", "FEEDING:UPDATE", "FEEDING:DELETE",
    "FATTENING:CREATE", "FATTENING:READ", "FATTENING:UPDATE", "FATTENING:DELETE",
    "AI:CREATE", "AI:READ", "AI:UPDATE", "AI:DELETE",
    "FINANCE:CREATE", "FINANCE:READ", "FINANCE:UPDATE", "FINANCE:DELETE",
    "COMMERCIAL:CREATE", "COMMERCIAL:READ", "COMMERCIAL:UPDATE", "COMMERCIAL:DELETE",
    "BI_DASHBOARD:CREATE", "BI_DASHBOARD:READ", "BI_DASHBOARD:UPDATE", "BI_DASHBOARD:DELETE",
    "COMMUNICATION:CREATE", "COMMUNICATION:READ", "COMMUNICATION:UPDATE", "COMMUNICATION:DELETE",
    "REPORTING:CREATE", "REPORTING:READ", "REPORTING:UPDATE", "REPORTING:DELETE",
    "ADMIN:CREATE", "ADMIN:READ", "ADMIN:UPDATE", "ADMIN:DELETE",
    "AI_ASSISTANT:CREATE", "AI_ASSISTANT:READ", "AI_ASSISTANT:UPDATE", "AI_ASSISTANT:DELETE",
  ],
  MANAGER: [
    "USERS:READ", "USERS:UPDATE",
    "EXPLOITATIONS:READ", "EXPLOITATIONS:UPDATE",
    "HERD:READ", "HERD:UPDATE",
    "IOT:READ", "IOT:UPDATE",
    "HEALTH:READ", "HEALTH:UPDATE",
    "REPRODUCTION:READ", "REPRODUCTION:UPDATE",
    "FEEDING:READ", "FEEDING:UPDATE",
    "FATTENING:READ", "FATTENING:UPDATE",
    "AI:READ",
    "FINANCE:READ", "FINANCE:UPDATE",
    "COMMERCIAL:READ", "COMMERCIAL:UPDATE",
    "BI_DASHBOARD:READ",
    "COMMUNICATION:READ", "COMMUNICATION:UPDATE",
    "REPORTING:READ",
    "AI_ASSISTANT:READ",
  ],
  ELEVEUR: [
    "HERD:READ", "HERD:UPDATE",
    "HEALTH:READ", "HEALTH:UPDATE",
    "REPRODUCTION:READ", "REPRODUCTION:UPDATE",
    "FEEDING:READ", "FEEDING:UPDATE",
    "FATTENING:READ", "FATTENING:UPDATE",
    "IOT:READ", "IOT:UPDATE",
  ],
  OUVRIER: [
    "HERD:READ",
    "HEALTH:READ",
    "FEEDING:READ",
    "FATTENING:READ",
    "IOT:READ",
    "COMMUNICATION:READ",
  ],
  VETERINAIRE: [
    "HERD:READ",
    "HEALTH:READ", "HEALTH:UPDATE", "HEALTH:CREATE",
    "REPRODUCTION:READ", "REPRODUCTION:UPDATE",
    "AI:READ",
    "COMMUNICATION:READ",
  ],
  COOPERATIVE: [
    "EXPLOITATIONS:READ",
    "BI_DASHBOARD:READ",
    "REPORTING:READ",
  ],
};

async function seedRolePermissions() {
  try {
    // Get all roles
    const allRoles = await db.select().from(roles);
    const roleMap: Record<string, number> = {};
    for (const r of allRoles) {
      roleMap[r.name] = r.id;
    }

    // Get all permissions
    const allPermissions = await db.select().from(permissions);
    const permMap: Record<string, number> = {};
    for (const p of allPermissions) {
      permMap[p.name] = p.id;
    }

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
      const roleId = roleMap[roleName];
      if (!roleId) {
        console.warn(`⚠️ Rôle "${roleName}" non trouvé.`);
        continue;
      }

      for (const permName of permNames) {
        const permId = permMap[permName];
        if (!permId) {
          console.warn(`⚠️ Permission "${permName}" non trouvée.`);
          continue;
        }

        // Check if already exists
        const existing = await db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleId),
              eq(rolePermissions.permissionId, permId)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db
            .insert(rolePermissions)
            .values({ roleId, permissionId: permId });
          totalInserted++;
        } else {
          totalSkipped++;
        }
      }
    }

    console.log(`✅ ${totalInserted} relations ajoutées, ${totalSkipped} déjà existantes.`);
  } catch (error) {
    console.error("Erreur :", error);
  }
  process.exit(0);
}

seedRolePermissions();