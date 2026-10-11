// Entry point — avvia il server HTTP
import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

app.listen(env.port, () => {
  logger.info(
    { nodeEnv: env.nodeEnv, corsOrigin: env.corsOrigin, logLevel: logger.level },
    `🏦 LipariBank API su http://localhost:${env.port}`,
  );
});
