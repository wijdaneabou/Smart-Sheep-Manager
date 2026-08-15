// mobile/src/constants/permissions.ts

export const PERMISSIONS_MAP: Record<string, string[]> = {
  admin: [
    // Users
    'USERS:READ', 'USERS:CREATE', 'USERS:UPDATE', 'USERS:DELETE',
    // Exploitations
    'EXPLOITATIONS:READ', 'EXPLOITATIONS:CREATE', 'EXPLOITATIONS:UPDATE',
    'EXPLOITATIONS:DELETE', 'EXPLOITATIONS:EXPORT', 'EXPLOITATIONS:AGGREGATE',
    // Herd
    'HERD:READ', 'HERD:CREATE', 'HERD:UPDATE', 'HERD:DELETE',
    'HERD:VALIDATE', 'HERD:EXPORT', 'HERD:AGGREGATE',
    // Old Health (full) – for fallback
    'HEALTH:READ', 'HEALTH:CREATE', 'HEALTH:UPDATE', 'HEALTH:DELETE',
    // New granular health permissions
    'HEALTH_RECORD:READ', 'HEALTH_RECORD:CREATE', 'HEALTH_RECORD:UPDATE', 'HEALTH_RECORD:DELETE',
    'TREATMENT:READ', 'TREATMENT:CREATE', 'TREATMENT:UPDATE', 'TREATMENT:DELETE', 'TREATMENT:ADMINISTER',
    'VACCINATION:READ', 'VACCINATION:CREATE', 'VACCINATION:UPDATE', 'VACCINATION:DELETE',
    'INTERVENTION:READ', 'INTERVENTION:CREATE', 'INTERVENTION:UPDATE', 'INTERVENTION:DELETE',
    'HEALTH_REPORT:READ',
    // Reproduction
    'REPRODUCTION:READ', 'REPRODUCTION:CREATE', 'REPRODUCTION:UPDATE',
    'REPRODUCTION:DELETE', 'REPRODUCTION:EXPORT', 'REPRODUCTION:AGGREGATE',
    // IoT
    'IOT:SHIELDS:READ', 'IOT:SHIELDS:CREATE', 'IOT:SHIELDS:UPDATE', 'IOT:SHIELDS:DELETE',
    'IOT:SENSOR:READ', 'IOT:SENSOR:CREATE',
    'IOT:ALERTS:READ', 'IOT:ALERTS:CREATE', 'IOT:ALERTS:UPDATE', 'IOT:ALERTS:DELETE',
    'IOT:ZONES:READ', 'IOT:ZONES:CREATE', 'IOT:ZONES:UPDATE', 'IOT:ZONES:DELETE',
    'IOT:ANALYTICS:READ',
  ],

  manager: [
    'EXPLOITATIONS:READ', 'EXPLOITATIONS:UPDATE', 'EXPLOITATIONS:EXPORT',
    'HERD:READ', 'HERD:VALIDATE', 'HERD:EXPORT',
    // Manager: read-only on old health (for fallback) + report
    'HEALTH:READ',
    // Granular: read-only
    'HEALTH_RECORD:READ',
    'TREATMENT:READ',
    'VACCINATION:READ',
    'INTERVENTION:READ',
    'HEALTH_REPORT:READ',
    'REPRODUCTION:READ', 'REPRODUCTION:EXPORT',
    'IOT:SHIELDS:READ',
    'IOT:SENSOR:READ',
    'IOT:ALERTS:READ',
    'IOT:ZONES:READ',
    'IOT:ANALYTICS:READ',
  ],

  eleveur: [
    'EXPLOITATIONS:READ', 'EXPLOITATIONS:UPDATE',
    'HERD:READ', 'HERD:CREATE', 'HERD:UPDATE', 'HERD:DELETE',
    // ❌ No 'HEALTH:CREATE' or 'HEALTH:UPDATE' – only read on old health
    'HEALTH:READ',
    // Granular: read-only for records, treatments, interventions
    'HEALTH_RECORD:READ',
    'TREATMENT:READ',
    'INTERVENTION:READ',
    // ✅ Vaccinations: full CRUD (eleveur can manage them)
    'VACCINATION:READ', 'VACCINATION:CREATE', 'VACCINATION:UPDATE', 'VACCINATION:DELETE',
    // ❌ No HEALTH_REPORT:READ (not allowed)
    'REPRODUCTION:READ', 'REPRODUCTION:CREATE', 'REPRODUCTION:UPDATE', 'REPRODUCTION:DELETE',
    'IOT:SHIELDS:READ', 'IOT:SHIELDS:CREATE', 'IOT:SHIELDS:UPDATE', 'IOT:SHIELDS:DELETE',
    'IOT:SENSOR:READ', 'IOT:SENSOR:CREATE',
    'IOT:ALERTS:READ', 'IOT:ALERTS:CREATE', 'IOT:ALERTS:UPDATE', 'IOT:ALERTS:DELETE',
    'IOT:ZONES:READ', 'IOT:ZONES:CREATE', 'IOT:ZONES:UPDATE', 'IOT:ZONES:DELETE',
    'IOT:ANALYTICS:READ',
  ],

  ouvrier: [
    'EXPLOITATIONS:READ',
    'HERD:READ',
    // Ouvrier: read-only on health (granular)
    'HEALTH_RECORD:READ',
    'TREATMENT:READ',
    'VACCINATION:READ',
    'INTERVENTION:READ',
    // No 'HEALTH:CREATE' etc.
  ],

  veterinaire: [
    'EXPLOITATIONS:READ',
    'HERD:READ', 'HERD:UPDATE',
    // ✅ Vet gets old HEALTH permissions (full) – for fallback
    'HEALTH:READ', 'HEALTH:CREATE', 'HEALTH:UPDATE', 'HEALTH:DELETE',
    // Granular: full CRUD on health records, treatments, interventions
    'HEALTH_RECORD:READ', 'HEALTH_RECORD:CREATE', 'HEALTH_RECORD:UPDATE', 'HEALTH_RECORD:DELETE',
    'TREATMENT:READ', 'TREATMENT:CREATE', 'TREATMENT:UPDATE', 'TREATMENT:DELETE', 'TREATMENT:ADMINISTER',
    'INTERVENTION:READ', 'INTERVENTION:CREATE', 'INTERVENTION:UPDATE', 'INTERVENTION:DELETE',
    // Vaccinations: read-only (eleveur manages them)
    'VACCINATION:READ',
    // Vet can view reports
    'HEALTH_REPORT:READ',
    // IoT: read-only (or as per spec)
    'IOT:SHIELDS:READ',
    'IOT:SENSOR:READ',
    'IOT:ALERTS:READ',
    'IOT:ANALYTICS:READ',
  ],

  cooperative: [
    'EXPLOITATIONS:READ', 'EXPLOITATIONS:AGGREGATE',
    'HERD:READ', 'HERD:AGGREGATE',
    'HEALTH_RECORD:READ',
    'TREATMENT:READ',
    'VACCINATION:READ',
    'INTERVENTION:READ',
    'HEALTH_REPORT:READ',
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