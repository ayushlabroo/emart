import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const server = app.listen(env.API_PORT, () => {
  logger.info("🚀 EMart API zinda hai", {
    port: env.API_PORT,
    env: env.NODE_ENV,
  });
});

function shutdown(signal: string) {
  logger.info(`${signal} mila — server band kar rahe hain...`);
  server.close(() => {
    logger.info("Server saaf band ho gaya. Bye 👋");
    process.exit(0); // 0 = "sab theek tha"
  });
}

// SIGINT = Ctrl+C,  SIGTERM = system/App Runner ka "band ho jao" signal
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
