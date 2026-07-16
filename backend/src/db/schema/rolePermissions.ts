import {
  mysqlTable,
  int,
  primaryKey,
} from "drizzle-orm/mysql-core";

export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    roleId: int("role_id").notNull(),

    permissionId: int("permission_id").notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.roleId,
        table.permissionId,
      ],
    }),
  })
);