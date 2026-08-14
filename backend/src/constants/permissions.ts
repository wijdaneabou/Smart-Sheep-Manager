// backend/src/constants/permissions.ts

export const PERMISSIONS_MAP: Record<string, string[]> = {
  admin: [
    // Module USERS
    'USERS:READ', 'USERS:CREATE', 'USERS:UPDATE', 'USERS:DELETE',
    // Module EXPLOITATIONS
    'EXPLOITATIONS:READ', 'EXPLOITATIONS:CREATE', 'EXPLOITATIONS:UPDATE',
    'EXPLOITATIONS:DELETE', 'EXPLOITATIONS:EXPORT', 'EXPLOITATIONS:AGGREGATE',
    // Module HERD
    'HERD:READ', 'HERD:CREATE', 'HERD:UPDATE', 'HERD:DELETE',
    'HERD:VALIDATE', 'HERD:EXPORT', 'HERD:AGGREGATE',
    // Module HEALTH
    'HEALTH:READ', 'HEALTH:CREATE', 'HEALTH:UPDATE', 'HEALTH:DELETE',
    'HEALTH:VALIDATE', 'HEALTH:EXPORT', 'HEALTH:AGGREGATE',
    // Module REPRODUCTION
    'REPRODUCTION:READ', 'REPRODUCTION:CREATE', 'REPRODUCTION:UPDATE',
    'REPRODUCTION:DELETE', 'REPRODUCTION:EXPORT', 'REPRODUCTION:AGGREGATE',
    // ============================================
    // 🟢 MODULE IOT 
    // ============================================
    'IOT:SHIELDS:READ', 'IOT:SHIELDS:CREATE', 'IOT:SHIELDS:UPDATE', 'IOT:SHIELDS:DELETE',
    'IOT:SENSOR:READ', 'IOT:SENSOR:CREATE',
    'IOT:ALERTS:READ', 'IOT:ALERTS:CREATE', 'IOT:ALERTS:UPDATE', 'IOT:ALERTS:DELETE',
    'IOT:ZONES:READ', 'IOT:ZONES:CREATE', 'IOT:ZONES:UPDATE', 'IOT:ZONES:DELETE',
    'IOT:ANALYTICS:READ',
  ],
  manager: [
    'EXPLOITATIONS:READ', 'EXPLOITATIONS:UPDATE', 'EXPLOITATIONS:EXPORT',
    'HERD:READ', 'HERD:VALIDATE', 'HERD:EXPORT',
    'HEALTH:READ', 'HEALTH:VALIDATE', 'HEALTH:EXPORT',
    'REPRODUCTION:READ', 'REPRODUCTION:EXPORT',
    // ============================================
    // 🟢 IOT - Manager (READ ONLY - US-4.5)
    // ============================================
    'IOT:SHIELDS:READ',
    'IOT:SENSOR:READ',
    'IOT:ALERTS:READ',
    'IOT:ZONES:READ',
    'IOT:ANALYTICS:READ',
  ],
  eleveur: [
    'EXPLOITATIONS:READ', 'EXPLOITATIONS:UPDATE',
    'HERD:READ', 'HERD:CREATE', 'HERD:UPDATE', 'HERD:DELETE',
    'HEALTH:READ', 'HEALTH:CREATE', 'HEALTH:UPDATE',
    'REPRODUCTION:READ', 'REPRODUCTION:CREATE', 'REPRODUCTION:UPDATE', 'REPRODUCTION:DELETE',
    // ============================================
    // 🟢 IOT - Eleveur (FULL CRUD - US-4.1 à 4.4)
    // ============================================
    'IOT:SHIELDS:READ', 'IOT:SHIELDS:CREATE', 'IOT:SHIELDS:UPDATE', 'IOT:SHIELDS:DELETE',
    'IOT:SENSOR:READ', 'IOT:SENSOR:CREATE',
    'IOT:ALERTS:READ', 'IOT:ALERTS:CREATE', 'IOT:ALERTS:UPDATE', 'IOT:ALERTS:DELETE',
    'IOT:ZONES:READ', 'IOT:ZONES:CREATE', 'IOT:ZONES:UPDATE', 'IOT:ZONES:DELETE',
    'IOT:ANALYTICS:READ',
  ],
  ouvrier: [
    'EXPLOITATIONS:READ',
    'HERD:READ',
    'HEALTH:READ', 'HEALTH:UPDATE',
    // ============================================
    // ❌ IOT - Ouvrier (aucune permission)
    // ============================================
    // Aucune ligne IOT
  ],
  veterinaire: [
    'EXPLOITATIONS:READ',
    'HERD:READ', 'HERD:UPDATE',
    'HEALTH:READ', 'HEALTH:CREATE', 'HEALTH:UPDATE', 'HEALTH:DELETE', 'HEALTH:VALIDATE',
    'REPRODUCTION:READ', 'REPRODUCTION:UPDATE',
    // ============================================
    // 🟢 IOT - Veterinaire (READ ONLY - US-4.6)
    // ============================================
    'IOT:SHIELDS:READ',
    'IOT:SENSOR:READ',
    'IOT:ALERTS:READ',
    'IOT:ANALYTICS:READ',
  ],
  cooperative: [
    'EXPLOITATIONS:READ', 'EXPLOITATIONS:AGGREGATE',
    'HERD:READ', 'HERD:AGGREGATE',
    'HEALTH:READ', 'HEALTH:AGGREGATE',
    'REPRODUCTION:READ', 'REPRODUCTION:AGGREGATE',
    
  ],
};

export function hasPermission(roleName: string, module: string, action: string): boolean {
  const normalizedRole = roleName.toLowerCase();
  const perms = PERMISSIONS_MAP[normalizedRole] || [];
  return perms.includes(`${module}:${action}`);
}

export function canAccessModule(roleName: string, module: string): boolean {
  const normalizedRole = roleName.toLowerCase();
  const perms = PERMISSIONS_MAP[normalizedRole] || [];
  return perms.some(p => p.startsWith(`${module}:`));
}