import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { dashboardProfiles, userDashboardWidgets } from "../db/schema/userDashboardWidgets.js";
import type { WidgetInsert } from "../db/schema/userDashboardWidgets.js";

export interface DashboardProfile {
  id: number;
  userId: number;
  name: string;
  isDefault: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserWidgetConfig {
  id: number;
  profileId: number;
  widgetType: string;
  isVisible: boolean;
  sortOrder: number;
  size: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface WidgetConfigItemInput {
  widgetType: string;
  isVisible: boolean;
  sortOrder: number;
  size: string;
}

export async function getProfiles(userId: number): Promise<DashboardProfile[]> {
  const rows = await db.select().from(dashboardProfiles).where(eq(dashboardProfiles.userId, userId)).orderBy(dashboardProfiles.name);
  return rows as DashboardProfile[];
}

export async function getProfileById(profileId: number, userId: number): Promise<DashboardProfile | null> {
  const [profile] = await db.select().from(dashboardProfiles).where(and(eq(dashboardProfiles.id, profileId), eq(dashboardProfiles.userId, userId)));
  return profile ?? null;
}

export async function getDefaultProfileId(userId: number): Promise<number | null> {
  const [profile] = await db.select().from(dashboardProfiles).where(and(eq(dashboardProfiles.userId, userId), eq(dashboardProfiles.isDefault, true))).limit(1);
  return profile?.id ?? null;
}

export async function createProfile(userId: number, name: string): Promise<DashboardProfile> {
  const [profile] = await db.insert(dashboardProfiles).values({ userId, name }).$returningId();
  return profile as DashboardProfile;
}

export async function updateProfile(profileId: number, userId: number, name: string): Promise<DashboardProfile | null> {
  await db.update(dashboardProfiles).set({ name, updatedAt: new Date() }).where(and(eq(dashboardProfiles.id, profileId), eq(dashboardProfiles.userId, userId)));
  return getProfileById(profileId, userId);
}

export async function deleteProfile(profileId: number, userId: number): Promise<boolean> {
  const result = await db.delete(dashboardProfiles).where(and(eq(dashboardProfiles.id, profileId), eq(dashboardProfiles.userId, userId)));
  return (result as any).rowsAffected > 0;
}

export async function setDefaultProfile(profileId: number, userId: number): Promise<void> {
  await db.update(dashboardProfiles).set({ isDefault: false }).where(eq(dashboardProfiles.userId, userId));
  await db.update(dashboardProfiles).set({ isDefault: true, updatedAt: new Date() }).where(and(eq(dashboardProfiles.id, profileId), eq(dashboardProfiles.userId, userId)));
}

export async function getUserWidgetConfig(profileId: number): Promise<UserWidgetConfig[]> {
  const rows = await db.select().from(userDashboardWidgets).where(eq(userDashboardWidgets.profileId, profileId)).orderBy(userDashboardWidgets.sortOrder);
  return rows as UserWidgetConfig[];
}

export async function upsertUserWidgetConfig(profileId: number, items: WidgetConfigItemInput[]): Promise<UserWidgetConfig[]> {
  const results: UserWidgetConfig[] = [];

  for (const item of items) {
    const values: WidgetInsert = {
      widgetType: item.widgetType as WidgetInsert["widgetType"],
      isVisible: item.isVisible,
      sortOrder: item.sortOrder,
      size: item.size as WidgetInsert["size"],
      profileId,
    };
    const [row] = await db.insert(userDashboardWidgets).values(values).onDuplicateKeyUpdate({
      set: {
        isVisible: item.isVisible,
        sortOrder: item.sortOrder,
        size: item.size as WidgetInsert["size"],
        updatedAt: new Date(),
      },
    });
    results.push(row as unknown as UserWidgetConfig);
  }

  return results;
}

export async function getDefaultWidgetConfig(): Promise<WidgetConfigItemInput[]> {
  return [
    { widgetType: "kpi-herd", isVisible: true, sortOrder: 0, size: "medium" },
    { widgetType: "kpi-gmq", isVisible: true, sortOrder: 1, size: "medium" },
    { widgetType: "kpi-fcr", isVisible: true, sortOrder: 2, size: "medium" },
    { widgetType: "kpi-mortality", isVisible: true, sortOrder: 3, size: "medium" },
    { widgetType: "chart-gmq-trend", isVisible: true, sortOrder: 4, size: "large" },
    { widgetType: "chart-breed-distribution", isVisible: true, sortOrder: 5, size: "medium" },
    { widgetType: "chart-financial", isVisible: true, sortOrder: 6, size: "large" },
    { widgetType: "table-races", isVisible: true, sortOrder: 7, size: "medium" },
    { widgetType: "table-charges", isVisible: true, sortOrder: 8, size: "medium" },
    { widgetType: "alerts", isVisible: true, sortOrder: 9, size: "medium" },
    { widgetType: "calendar", isVisible: true, sortOrder: 10, size: "medium" },
  ];
}
