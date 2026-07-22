import { serve } from "@hono/node-server";
import app from "./app.js";

const PORT = 3000; // ← Make sure this is 5000

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: "0.0.0.0", // ← Listen on all interfaces
  },
  () => {
    console.log(`🚀 Server is running on http://172.27.182.251:${PORT}`);
    
  }
);