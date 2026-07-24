import { serve } from "@hono/node-server";
import app from "./app.js";

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