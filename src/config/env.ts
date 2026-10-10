// Configurazione da variabili d'ambiente (con default sensati per lo sviluppo locale)
import fs from "node:fs";

// Carica .env se presente (Node >= 20.12 / 21.7 espone process.loadEnvFile)
if (fs.existsSync(".env")) {
  process.loadEnvFile(".env");
}

export const env = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
