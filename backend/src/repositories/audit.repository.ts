import { db } from "../db/connection.js";
import { auditLogs, users } from "../db/schema/index.js";

import {
  and,
  desc,
  eq,
  gte,
  lte,
  or,
  ilike,
  SQL,
} from "drizzle-orm";

export interface AuditFilters {
  userId?: number;
  module?: string;
  action?: string;
  result?: string;
  from?: Date;
  to?: Date;
  search?: string;
}

function buildWhere(filters: AuditFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  if (filters.module) conditions.push(eq(auditLogs.module, filters.module));
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.result) conditions.push(eq(auditLogs.result, filters.result));
  if (filters.from) conditions.push(gte(auditLogs.createdAt, filters.from));
  if (filters.to) conditions.push(lte(auditLogs.createdAt, filters.to));

  // ✅ Recherche multi-colonnes
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(auditLogs.module, term),
        ilike(auditLogs.action, term),
        ilike(auditLogs.ip, term),
        ilike(users.firstName, term),
        ilike(users.lastName, term),
        ilike(users.email, term)
      )!
    );
  }

  return conditions.length ? and(...conditions) : undefined;
}

export const auditRepository = {

  async create(data: typeof auditLogs.$inferInsert) {
    await db.insert(auditLogs).values(data);
  },

  async findAll(
    filters: AuditFilters,
    page = 1,
    limit = 20
  ) {

    const where = buildWhere(filters);

    return await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,

      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,

      module: auditLogs.module,
      action: auditLogs.action,
      description: auditLogs.description,
      result: auditLogs.result,
      ip: auditLogs.ip,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
    },

  async export(filters: AuditFilters) {

    const where = buildWhere(filters);

    return await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,

      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,

      module: auditLogs.module,
      action: auditLogs.action,
      description: auditLogs.description,
      result: auditLogs.result,
      ip: auditLogs.ip,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt));
  },
};