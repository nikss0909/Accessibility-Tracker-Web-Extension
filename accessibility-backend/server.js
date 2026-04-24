import app from "./src/app.js";
import { connectDatabase } from "./src/config/database.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";

async function startServer() {
  await connectDatabase();

  app.listen(env.port, () => {
    logger.info("api_started", { port: env.port });
  });
}

startServer().catch((error) => {
  logger.error("api_start_failed", { message: error.message, stack: error.stack });
  process.exit(1);
});
