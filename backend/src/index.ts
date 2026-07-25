import { serve } from "@hono/node-server";
import app from "./app.js";
import { ensureAuditAndSessionTables } from "./db/bootstrap.js";

async function main() {
  await ensureAuditAndSessionTables();

  serve(
    {
      fetch: app.fetch,
      port: 3000,
      hostname: "0.0.0.0",
    },
    () => {
      console.log("🚀 Server running on http://172.27.182.10:3000");
    }
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
