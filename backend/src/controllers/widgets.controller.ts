import type { Context } from "hono";
import { Hono } from "hono";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import * as widgetsService from "../services/widgets.service.js";
import { upsertWidgetConfigSchema, createProfileSchema } from "../validators/widgets.validator.js";

export async function getWidgetConfig(c: Context) {
  const user = c.get("user") as { id: number } | undefined;
  if (!user) return c.json({ error: "Authentification requise." }, 401);

  const profileId = c.req.query("profileId");
  let targetProfileId = profileId ? Number(profileId) : null;

  if (!targetProfileId) {
    const defaultId = await widgetsService.getDefaultProfileId(user.id);
    targetProfileId = defaultId;
  }

  if (!targetProfileId) {
    const defaultConfig = await widgetsService.getDefaultWidgetConfig();
    return c.json({ data: defaultConfig, profileId: null });
  }

  const profile = await widgetsService.getProfileById(targetProfileId, user.id);
  if (!profile) {
    const defaultConfig = await widgetsService.getDefaultWidgetConfig();
    return c.json({ data: defaultConfig, profileId: null });
  }

  const config = await widgetsService.getUserWidgetConfig(targetProfileId);
  return c.json({ data: config, profileId: targetProfileId });
}

export async function upsertWidgetConfig(c: Context) {
  const user = c.get("user") as { id: number } | undefined;
  if (!user) return c.json({ error: "Authentification requise." }, 401);

  const parsed = upsertWidgetConfigSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const profileId = c.req.query("profileId");
  let targetProfileId = profileId ? Number(profileId) : null;

  if (!targetProfileId) {
    const defaultId = await widgetsService.getDefaultProfileId(user.id);
    targetProfileId = defaultId;
  }

  if (!targetProfileId) {
    const profile = await widgetsService.createProfile(user.id, "Default");
    targetProfileId = profile.id;
  }

  const config = await widgetsService.upsertUserWidgetConfig(targetProfileId, parsed.data.widgets);
  return c.json({ data: config, profileId: targetProfileId });
}

export async function getDefaultWidgetConfig(c: Context) {
  const config = await widgetsService.getDefaultWidgetConfig();
  return c.json({ data: config });
}

export async function listProfiles(c: Context) {
  const user = c.get("user") as { id: number } | undefined;
  if (!user) return c.json({ error: "Authentification requise." }, 401);
  const profiles = await widgetsService.getProfiles(user.id);
  return c.json({ data: profiles });
}

export async function createProfile(c: Context) {
  const user = c.get("user") as { id: number } | undefined;
  if (!user) return c.json({ error: "Authentification requise." }, 401);

  const parsed = createProfileSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const existing = await widgetsService.getProfiles(user.id);
  if (existing.length === 0) {
    const profile = await widgetsService.createProfile(user.id, parsed.data.name);
    await widgetsService.setDefaultProfile(profile.id, user.id);
    const defaultConfig = await widgetsService.getDefaultWidgetConfig();
    await widgetsService.upsertUserWidgetConfig(profile.id, defaultConfig);
    return c.json({ data: profile });
  }

  const profile = await widgetsService.createProfile(user.id, parsed.data.name);
  const defaultConfig = await widgetsService.getDefaultWidgetConfig();
  await widgetsService.upsertUserWidgetConfig(profile.id, defaultConfig);
  return c.json({ data: profile });
}

export async function updateProfile(c: Context) {
  const user = c.get("user") as { id: number } | undefined;
  if (!user) return c.json({ error: "Authentification requise." }, 401);

  const profileId = Number(c.req.param("id"));
  const parsed = createProfileSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const profile = await widgetsService.updateProfile(profileId, user.id, parsed.data.name);
  if (!profile) return c.json({ error: "Profil introuvable." }, 404);
  return c.json({ data: profile });
}

export async function deleteProfile(c: Context) {
  const user = c.get("user") as { id: number } | undefined;
  if (!user) return c.json({ error: "Authentification requise." }, 401);

  const profileId = Number(c.req.param("id"));
  const deleted = await widgetsService.deleteProfile(profileId, user.id);
  if (!deleted) return c.json({ error: "Profil introuvable." }, 404);
  return c.json({ data: { success: true } });
}

export async function setDefaultProfile(c: Context) {
  const user = c.get("user") as { id: number } | undefined;
  if (!user) return c.json({ error: "Authentification requise." }, 401);

  const profileId = Number(c.req.param("id"));
  const profile = await widgetsService.getProfileById(profileId, user.id);
  if (!profile) return c.json({ error: "Profil introuvable." }, 404);

  await widgetsService.setDefaultProfile(profileId, user.id);
  return c.json({ data: { success: true } });
}

export const widgetsRoutes = new Hono();

widgetsRoutes.get("/dashboard-widgets", getWidgetConfig);
widgetsRoutes.put("/dashboard-widgets", upsertWidgetConfig);
widgetsRoutes.get("/dashboard-widgets/default", getDefaultWidgetConfig);
widgetsRoutes.get("/dashboard-profiles", listProfiles);
widgetsRoutes.post("/dashboard-profiles", createProfile);
widgetsRoutes.put("/dashboard-profiles/:id", updateProfile);
widgetsRoutes.delete("/dashboard-profiles/:id", deleteProfile);
widgetsRoutes.post("/dashboard-profiles/:id/default", setDefaultProfile);
