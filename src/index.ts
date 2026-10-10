// Entry point — avvia il server HTTP
import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log("🏦 LipariBank API su http://localhost:" + env.port);
  console.log("   CORS origin: " + env.corsOrigin);
  console.log("   GET  /api/accounts       GET  /api/customers");
  console.log("   GET  /api/accounts/:id   GET  /api/customers/:id");
  console.log("   POST /api/accounts       POST /api/customers");
  console.log("   PUT  /api/accounts/:id   PUT  /api/customers/:id");
  console.log("   DEL  /api/accounts/:id   DEL  /api/customers/:id");
});
