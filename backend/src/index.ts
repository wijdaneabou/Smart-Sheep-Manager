import { serve } from "@hono/node-server";
import app from "./app.js";
import { ensureAuditAndSessionTables } from "./db/bootstrap.js";

async function main() {
  await ensureAuditAndSessionTables();

  serve(
    {
      fetch: app.fetch,
      port: 5000,
      hostname: "0.0.0.0",
    },
    () => {
      console.log("🚀 Server running on http://192.168.1.100:5000");
    }
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
