import type { Context } from "hono";
import { batchPerformanceComparisonQuerySchema } from "../validators/fatteningPerformance.validator.js";
import * as performanceService from "../services/fatteningPerformance.service.js";
import { getUserExploitationIds } from "../utils/permissions.js";

export async function compareBatchPerformanceHandler(c: Context) {
  const user = c.get("user") as { id: number; roleName?: string } | undefined;
  if (!user) return c.json({ error: "Non autorisé." }, 401);

  const parsed = batchPerformanceComparisonQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const allowedIds = await getUserExploitationIds(user.id, user.roleName || "");

  const result = await performanceService.compareBatchPerformance(
    {
      exploitationId: parsed.data.exploitationId,
      onlyCompleted: parsed.data.onlyCompleted,
    },
    allowedIds
  );

  if (!result.success) {
    return c.json({ error: result.message }, result.status);
  }

  return c.json(
    {
      data: result.batches,
      rankings: result.rankings,
    },
    result.status
  );
}
