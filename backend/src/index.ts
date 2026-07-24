import { serve } from "@hono/node-server";
import app from "./app.js";

const PORT = 3000; //


serve(
  {
    fetch: app.fetch,
    port: 3000,
    hostname: "0.0.0.0",
  },
  () => {

    console.log(`🚀 Server is running on http://172.27.182.251:${PORT}`);

  }
);