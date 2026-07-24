import type { Context } from "hono";

export function getClientIp(c: Context): string {

  console.log("===== HEADERS =====");
  console.log(Object.fromEntries(c.req.raw.headers.entries()));
  console.log("===================");

  const forwarded = c.req.header("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = c.req.header("x-real-ip");

  if (realIp) {
    return realIp;
  }

  return "UNKNOWN";
}