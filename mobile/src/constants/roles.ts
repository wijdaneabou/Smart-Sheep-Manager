// Liste statique des roles (coherente avec vos donnees seedees en base).
// A garder synchronisee manuellement si vous modifiez les IDs en base.
export const ROLES = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Manager" },
  { id: 3, name: "Eleveur" },
  { id: 4, name: "Ouvrier" },
  { id: 5, name: "Veterinaire" },
  { id: 6, name: "Cooperative" },
] as const;

export function getRoleName(roleId: number | null | undefined): string {
  if (!roleId) return "—";
  const role = ROLES.find((r) => r.id === roleId);
  return role?.name ?? `Role #${roleId}`;
}