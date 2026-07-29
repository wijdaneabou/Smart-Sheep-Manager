import { z } from "zod";

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ attendue).");
const timeValue = z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide (HH:MM attendue).");

export const employeeSchema = z.object({
  exploitationId: z.number().int().positive(), firstName: z.string().min(2).max(100), lastName: z.string().min(2).max(100),
  phone: z.string().max(30).optional(), email: z.string().email().max(150).optional(), position: z.string().min(2).max(100), status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
export const contractSchema = z.object({ employeeId: z.number().int().positive(), type: z.enum(["CDI", "CDD", "TEMPORAIRE", "SAISONNIER"]), startDate: dateValue, endDate: dateValue.optional(), hourlyRate: z.number().nonnegative(), monthlySalary: z.number().nonnegative().optional() });
export const scheduleSchema = z.object({ employeeId: z.number().int().positive(), workDate: dateValue, startTime: timeValue, endTime: timeValue, task: z.string().min(2).max(255), status: z.enum(["PLANNED", "DONE", "CANCELLED"]).default("PLANNED") });
export const hoursSchema = z.object({ employeeId: z.number().int().positive(), workDate: dateValue, hours: z.number().min(0).max(24), overtimeHours: z.number().min(0).max(24).default(0), note: z.string().max(255).optional() });
