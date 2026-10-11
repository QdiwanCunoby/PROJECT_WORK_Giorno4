// Configurazione da variabili d'ambiente (con default sensati per lo sviluppo locale)
import fs from "node:fs";

// Carica .env se presente (Node >= 20.12 / 21.7 espone process.loadEnvFile)
if (fs.existsSync(".env")) {
  process.loadEnvFile(".env");
}

const NODE_ENVS = ["development", "test", "production"] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

const nodeEnv = (NODE_ENVS as readonly string[]).includes(process.env.NODE_ENV ?? "")
  ? (process.env.NODE_ENV as NodeEnv)
  : "development";

export const env = {
  nodeEnv,
  port: parseInt(process.env.PORT ?? "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  logLevel: process.env.LOG_LEVEL,   // opzionale: sovrascrive il livello derivato da nodeEnv
};
