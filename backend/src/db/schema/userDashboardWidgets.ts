import { mysqlTable, int, varchar, boolean, timestamp, mysqlEnum, primaryKey } from "drizzle-orm/mysql-core";
import { users } from "./users.js";

export const dashboardProfiles = mysqlTable("dashboard_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userDashboardWidgets = mysqlTable(
  "user_dashboard_widgets",
  {
    profileId: int("profile_id").notNull().references(() => dashboardProfiles.id, { onDelete: "cascade" }),
    widgetType: mysqlEnum("widget_type", [
      "kpi-herd",
      "kpi-gmq",
      "kpi-fcr",
      "kpi-mortality",
      "chart-gmq-trend",
      "chart-breed-distribution",
      "chart-financial",
      "table-races",
      "table-charges",
      "alerts",
      "calendar",
    ]).notNull(),
    isVisible: boolean("is_visible").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    size: mysqlEnum("size", ["small", "medium", "large"]).notNull().default("medium"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.profileId, t.widgetType] }),
  })
);

export type DashboardProfileInsert = typeof dashboardProfiles.$inferInsert;
export type DashboardProfileSelect = typeof dashboardProfiles.$inferSelect;
export type WidgetInsert = typeof userDashboardWidgets.$inferInsert;
export type WidgetSelect = typeof userDashboardWidgets.$inferSelect;
