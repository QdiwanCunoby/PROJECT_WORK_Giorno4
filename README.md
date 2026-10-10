# project_day03

LipariBank Digital Channels — **Project Work Giorno 3: Express.js Fondamentale** (Routing, Middleware, Request/Response).

API REST con Express + TypeScript, architettura a layer **Route → Controller → Service → Repository**, due moduli CRUD (Account e Customer) con repository in-memory.

## Avvio

```bash
npm install
cp .env.example .env   # opzionale: PORT e CORS_ORIGIN hanno dei default
npm run dev            # http://localhost:3000
npm run typecheck      # tsc --noEmit
```

| Variabile     | Default                 | Descrizione                              |
|---------------|-------------------------|------------------------------------------|
| `PORT`        | `3000`                  | Porta HTTP                               |
| `CORS_ORIGIN` | `http://localhost:5173` | Origini ammesse, separate da virgola     |

## Struttura

```
src/
├── index.ts                    # entry point: app.listen
├── app.ts                      # composition root + pipeline middleware
├── config/env.ts               # PORT, CORS_ORIGIN
├── middleware/
│   ├── requestLogger.ts        # [METHOD] URL - status (tempo ms) su res.on("finish")
│   ├── notFoundHandler.ts      # 404 ROUTE_NOT_FOUND
│   └── errorHandler.ts         # AppError → status HTTP, JSON malformato → 400
├── shared/
│   ├── apiResponse.ts          # envelope { data } / { error: { code, message } }
│   └── errors.ts               # ValidationError 400, NotFoundError 404, ConflictError 409
└── modules/
    ├── account/                # types, repository, service, controller, routes
    └── customer/               # stessa struttura di account/
requests/liparibank.http        # 10 richieste per REST Client (VS Code)
postman/LipariBank.postman_collection.json
```

## Pipeline middleware (`src/app.ts`)

1. `helmet()` — header di sicurezza
2. `cors({ origin: env.corsOrigin.split(","), credentials: true })`
3. `express.json({ limit: "100kb" })`
4. `requestLogger` — es. `[POST] /api/accounts - 201 (0.7 ms)`
5. router `/api/accounts` e `/api/customers`
6. `notFoundHandler` + `errorHandler` (sempre per ultimi)

## Endpoint

Risposte di successo: `{ "data": ... }`. Errori: `{ "error": { "code", "message" } }`.

| Metodo | Path                  | Successo | Errori        |
|--------|-----------------------|----------|---------------|
| GET    | `/api/accounts`       | 200      |               |
| GET    | `/api/accounts/:id`   | 200      | 404           |
| POST   | `/api/accounts`       | 201      | 400, 409 IBAN |
| PUT    | `/api/accounts/:id`   | 200      | 400, 404      |
| DELETE | `/api/accounts/:id`   | 204      | 404           |
| GET    | `/api/customers`      | 200      |               |
| GET    | `/api/customers/:id`  | 200      | 404           |
| POST   | `/api/customers`      | 201      | 400, 409 CF   |
| PUT    | `/api/customers/:id`  | 200      | 400, 404      |
| DELETE | `/api/customers/:id`  | 204      | 404           |

**Account** — `id, iban, holderName, balance, accountType (CHECKING|SAVINGS|DEPOSIT), status (ACTIVE|BLOCKED|CLOSED), createdAt, customerId`.
PUT modifica `holderName, accountType, status, customerId`.

**Customer** — `id, fiscalCode, firstName, lastName, email, phone, status (ACTIVE|INACTIVE)`.
Il codice fiscale è validato, salvato in maiuscolo e deve essere unico (409). PUT modifica `firstName, lastName, email, phone, status`.

## Test manuale

- **REST Client**: apri `requests/liparibank.http` e clicca *Send Request* in ordine (i POST salvano l'id per le richieste successive).
- **Postman**: *Import* → `postman/LipariBank.postman_collection.json`, poi *Run collection* (gli id vengono salvati nelle variabili `accountId` / `customerId`).
