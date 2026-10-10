// Configurazione Express app + composition root — separata da index.ts per i test (Giorno 7)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";
import { AccountRepository } from "./modules/account/account.repository";
import { AccountService } from "./modules/account/account.service";
import { AccountController } from "./modules/account/account.controller";
import { createAccountRoutes } from "./modules/account/account.routes";
import { CustomerRepository } from "./modules/customer/customer.repository";
import { CustomerService } from "./modules/customer/customer.service";
import { CustomerController } from "./modules/customer/customer.controller";
import { createCustomerRoutes } from "./modules/customer/customer.routes";

// ─── Composition root: Repository → Service → Controller → Routes ───
const accountRepository = new AccountRepository();
const accountService = new AccountService(accountRepository);
const accountController = new AccountController(accountService);
const accountRoutes = createAccountRoutes(accountController);

const customerRepository = new CustomerRepository();
const customerService = new CustomerService(customerRepository);
const customerController = new CustomerController(customerService);
const customerRoutes = createCustomerRoutes(customerController);

const app = express();

// ─── Pipeline middleware (l'ordine conta: ogni richiesta li attraversa dall'alto in basso) ───
app.use(helmet());                                                         // 1. Security headers
app.use(cors({ origin: env.corsOrigin.split(","), credentials: true }));   // 2. CORS (anche preflight OPTIONS)
app.use(express.json({ limit: "100kb" }));                                 // 3. Parse body JSON → req.body
app.use(requestLogger);                                                    // 4. [METHOD] URL - status (ms)

// ─── Routes ───
app.use("/api/accounts", accountRoutes);                                   // 5. Router Account
app.use("/api/customers", customerRoutes);                                 //    Router Customer

// ─── Health check ───
app.get("/health", (req, res) => {
  res.json({ data: { status: "ok", timestamp: new Date().toISOString() } });
});

// ─── 404 catch-all + error handler (sempre per ultimi) ───
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
