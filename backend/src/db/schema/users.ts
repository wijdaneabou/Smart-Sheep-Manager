import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  primaryKey
} from "drizzle-orm/mysql-core";


// ============================
// TABLE ROLES
// ============================

export const roles = mysqlTable("roles", {
  id: int("id")
    .autoincrement()
    .primaryKey(),

  name: varchar("name", {
    length: 50
  })
    .notNull()
    .unique(),

  description: text("description"),

  createdAt: timestamp("created_at")
    .defaultNow(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
});


// ============================
// TABLE PERMISSIONS
// ============================

export const permissions = mysqlTable("permissions", {
  id: int("id")
    .autoincrement()
    .primaryKey(),

  name: varchar("name", {
    length: 100
  })
    .notNull()
    .unique(),

  description: text("description"),

  createdAt: timestamp("created_at")
    .defaultNow(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
});


// ============================
// TABLE USERS
// ============================

export const users = mysqlTable("users", {

  id: int("id")
    .autoincrement()
    .primaryKey(),

  firstName: varchar("first_name", {
    length: 100
  }).notNull(),

  lastName: varchar("last_name", {
    length: 100
  }).notNull(),


  email: varchar("email", {
    length: 150
  })
    .notNull()
    .unique(),


  phone: varchar("phone", {
    length: 20
  }),


  password: varchar("password", {
    length: 255
  })
    .notNull(),


  photo: varchar("photo", {
    length: 255
  }),


  roleId: int("role_id")
    .notNull(),


  status: mysqlEnum("status", [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED"
  ])
    .default("ACTIVE"),


  lastLogin: timestamp("last_login"),


  createdAt: timestamp("created_at")
    .defaultNow(),


  updatedAt: timestamp("updated_at")
    .defaultNow()
});


// ============================
// TABLE ROLE_PERMISSIONS
// ============================

export const rolePermissions = mysqlTable(
  "role_permissions",
  {

    roleId: int("role_id")
      .notNull(),

    permissionId: int("permission_id")
      .notNull()

  },

  (table) => ({
    pk: primaryKey({
      columns: [
        table.roleId,
        table.permissionId
      ]
    })
  })
);