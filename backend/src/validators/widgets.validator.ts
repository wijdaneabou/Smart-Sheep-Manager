import { z } from "zod";

export const widgetTypeSchema = z.enum([
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
]);

export const widgetSizeSchema = z.enum(["small", "medium", "large"]);

export const widgetConfigItemSchema = z.object({
  widgetType: widgetTypeSchema,
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
  size: widgetSizeSchema.default("medium"),
});

export const upsertWidgetConfigSchema = z.object({
  widgets: z.array(widgetConfigItemSchema),
});

export const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
});

export type WidgetConfigItem = z.infer<typeof widgetConfigItemSchema>;
export type UpsertWidgetConfig = z.infer<typeof upsertWidgetConfigSchema>;
export type CreateProfile = z.infer<typeof createProfileSchema>;
