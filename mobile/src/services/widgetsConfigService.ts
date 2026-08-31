import api from "./api";

export interface WidgetConfigItem {
  id?: number;
  profileId?: number;
  widgetType: string;
  isVisible: boolean;
  sortOrder: number;
  size: "small" | "medium" | "large";
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardProfile {
  id: number;
  userId: number;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchWidgetConfig(profileId?: number) {
  const params = profileId ? { params: { profileId } } : {};
  const response = await api.get<{ data: WidgetConfigItem[]; profileId: number | null }>("/dashboard/dashboard-widgets", params);
  return response.data;
}

export async function fetchDefaultWidgetConfig() {
  const response = await api.get<{ data: WidgetConfigItem[] }>("/dashboard/dashboard-widgets/default");
  return response.data.data;
}

export async function saveWidgetConfig(profileId: number, widgets: WidgetConfigItem[]) {
  const response = await api.put<{ data: WidgetConfigItem[]; profileId: number }>("/dashboard/dashboard-widgets?profileId=" + profileId, { widgets });
  return response.data;
}

export async function fetchProfiles() {
  const response = await api.get<{ data: DashboardProfile[] }>("/dashboard/dashboard-profiles");
  return response.data.data;
}

export async function createProfile(name: string) {
  const response = await api.post<{ data: DashboardProfile }>("/dashboard/dashboard-profiles", { name });
  return response.data.data;
}

export async function updateProfile(profileId: number, name: string) {
  const response = await api.put<{ data: DashboardProfile }>(`/dashboard/dashboard-profiles/${profileId}`, { name });
  return response.data.data;
}

export async function deleteProfile(profileId: number) {
  const response = await api.delete(`/dashboard/dashboard-profiles/${profileId}`);
  return response.data;
}

export async function setDefaultProfile(profileId: number) {
  const response = await api.post(`/dashboard/dashboard-profiles/${profileId}/default`);
  return response.data;
}
