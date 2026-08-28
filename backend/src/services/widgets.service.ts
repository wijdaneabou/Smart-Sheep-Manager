import * as widgetsRepository from "../repositories/widgets.repository.js";
import type { WidgetConfigItemInput } from "../repositories/widgets.repository.js";

export async function getProfiles(userId: number) {
  return widgetsRepository.getProfiles(userId);
}

export async function getProfileById(profileId: number, userId: number) {
  return widgetsRepository.getProfileById(profileId, userId);
}

export async function getDefaultProfileId(userId: number) {
  return widgetsRepository.getDefaultProfileId(userId);
}

export async function createProfile(userId: number, name: string) {
  return widgetsRepository.createProfile(userId, name);
}

export async function updateProfile(profileId: number, userId: number, name: string) {
  return widgetsRepository.updateProfile(profileId, userId, name);
}

export async function deleteProfile(profileId: number, userId: number) {
  return widgetsRepository.deleteProfile(profileId, userId);
}

export async function setDefaultProfile(profileId: number, userId: number) {
  return widgetsRepository.setDefaultProfile(profileId, userId);
}

export async function getUserWidgetConfig(profileId: number) {
  return widgetsRepository.getUserWidgetConfig(profileId);
}

export async function upsertUserWidgetConfig(profileId: number, items: WidgetConfigItemInput[]) {
  return widgetsRepository.upsertUserWidgetConfig(profileId, items);
}

export async function getDefaultWidgetConfig() {
  return widgetsRepository.getDefaultWidgetConfig();
}
