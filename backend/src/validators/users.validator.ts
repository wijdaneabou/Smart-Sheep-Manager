import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email().max(150),
  phone: z.string().max(20).optional(),
  password: z.string().min(8).max(100),
  roleId: z.number().int().positive(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  email: z.string().email().max(150).optional(),
  phone: z.string().max(20).optional(),
  roleId: z.number().int().positive().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export const loginHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});