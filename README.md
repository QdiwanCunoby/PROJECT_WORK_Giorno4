# PROJECT_WORK_Giorno4

LipariBank Digital Channels — **Project Work Giorno 4: Validazione, Error Handling & Logging**.

API REST con Express + TypeScript, architettura a layer **Route → Controller → Service → Repository**, due moduli CRUD
(Account e Customer) con repository in-memory. Rispetto al Giorno 3: validazione con **Zod**, gerarchia **AppError**,
**asyncHandler** + **errorHandler** centralizzato, logging strutturato **Pino** con redaction e **request ID** per correlation.

## Avvio

```bash
npm install
cp .env.example .env   # opzionale: tutte le variabili hanno dei default
npm run dev            # http://localhost:3000
npm run typecheck      # tsc --noEmit
```

| Variabile     | Default                 | Descrizione                                                       |
|---------------|-------------------------|-------------------------------------------------------------------|
| `NODE_ENV`    | `development`           | `development` → log `debug` leggibili (pino-pretty), `test` → `silent`, `production` → `info` in JSON |
| `PORT`        | `3000`                  | Porta HTTP                                                        |
| `CORS_ORIGIN` | `http://localhost:5173` | Origini ammesse, separate da virgola                              |
| `LOG_LEVEL`   | —                       | Opzionale, sovrascrive il livello derivato da `NODE_ENV`          |

## Struttura

```
src/
├── index.ts                    # entry point: app.listen
├── app.ts                      # composition root + pipeline middleware
├── config/env.ts               # NODE_ENV, PORT, CORS_ORIGIN, LOG_LEVEL
├── middleware/
│   ├── requestId.ts            # crypto.randomUUID() → req.id + header X-Request-Id
│   ├── requestLogger.ts        # pino-http: una riga per richiesta con reqId, status, responseTime
│   ├── validate.ts             # validate(schema, "body" | "query" | "params") → 422
│   ├── notFoundHandler.ts      # 404 ROUTE_NOT_FOUND
│   └── errorHandler.ts         # (err, req, res, next): AppError | ZodError | JSON malformato | 500
├── utils/
│   ├── errors.ts               # AppError + 5 sottoclassi, toJSON()
│   ├── asyncHandler.ts         # cattura le promise rejection → next(err)
│   ├── logger.ts               # Pino + redaction PCI-DSS/GDPR
│   └── apiResponse.ts          # envelope { data } / { error: { code, message } }
└── modules/
    ├── account/                # types (+ schemi Zod), repository, service, controller, routes
    └── customer/               # stessa struttura di account/
requests/liparibank.http        # REST Client (VS Code), compresi i casi di errore
postman/LipariBank.postman_collection.json
```

## Esercizio 1 — Gerarchia `AppError` (`src/utils/errors.ts`)

`AppError(statusCode, code, message, details?)` con `toJSON()` → `{ error: { code, message, details? } }`.

| Classe              | Status | `code`             | Uso                                            |
|---------------------|--------|--------------------|------------------------------------------------|
| `NotFoundError`     | 404    | `NOT_FOUND`        | risorsa inesistente                            |
| `ValidationError`   | 422    | `VALIDATION_ERROR` | input non valido; `ValidationError.fromZod()` produce i `details` per campo |
| `UnauthorizedError` | 401    | `UNAUTHORIZED`     | autenticazione (G6)                            |
| `ForbiddenError`    | 403    | `FORBIDDEN`        | autorizzazione (G6)                            |
| `ConflictError`     | 409    | `CONFLICT`         | IBAN o codice fiscale duplicato                |

## Esercizio 2 — Schemi Zod

Gli schemi stanno in `account.types.ts` / `customer.types.ts` e i DTO ne derivano con `z.infer`: una sola fonte di verità
per la validazione a runtime e per i tipi a compile time.

- **`createAccountSchema`**: `ownerId` UUID, `iban` 27 caratteri in formato IT (normalizzato in maiuscolo),
  `type` `CHECKING | SAVINGS | BUSINESS`, `initialBalance` ≥ 0 con default `0` (salvato come `balance`).
- **`updateAccountSchema`**: `ownerId`, `type`, `status`, tutti opzionali ma almeno uno. IBAN e saldo non si modificano via PUT.
- **`createCustomerSchema`**: `fiscalCode` (regex del codice fiscale italiano, normalizzato in maiuscolo), `firstName`, `lastName`, `email`, `phone`.
- **`updateCustomerSchema`**: tutti i campi tranne `fiscalCode` (immutabile), più `status`, tutti opzionali ma almeno uno.

Lo schema rimuove i campi non previsti: un `id`, `status` o `balance` inviati dal client vengono scartati.
Nel Service resta solo la logica che dipende dallo stato (unicità → 409, esistenza → 404).

> Il PDF usa la sintassi Zod 3 (`z.string().uuid()`); con Zod 4 la forma consigliata è `z.uuid()` / `z.email()`.

## Esercizio 3 — Middleware `validate` (`src/middleware/validate.ts`)

```ts
router.post("/",   validate(createAccountSchema), controller.create);
router.put("/:id", validate(updateAccountSchema), controller.update);
```

`safeParse(req[target])`: se fallisce → `next(ValidationError.fromZod(error))`, altrimenti `req[target]` viene sostituito
con il dato parsato (default applicati, stringhe normalizzate, campi extra rimossi).

## Esercizio 4 — `asyncHandler` + `errorHandler`

- Tutti i controller usano `asyncHandler(async (req, res) => { ... })`, senza `try/catch`. Il Service lancia
  `NotFoundError` / `ConflictError` e l'errore arriva all'errorHandler. Express 4 ignora la Promise di un handler
  async: senza il wrapper una rejection lascerebbe la richiesta appesa. Express 5 lo gestisce da solo.
- `errorHandler(err, req, res, next)` è l'**ultimo** `app.use()`. Logga con `reqId` e risponde:
  - `AppError` → `err.statusCode` + `err.toJSON()`
  - `ZodError` → `422 { error: { code: "VALIDATION_ERROR", message, details } }`
  - body JSON malformato → `400 INVALID_JSON`; troppo grande → `413`
  - altro → `500 INTERNAL_ERROR` con messaggio generico (stack trace solo nei log, mai al client)

## Esercizio 5 — Pino + request ID

- `src/utils/logger.ts`: livello da `env.nodeEnv`, pino-pretty solo in sviluppo, JSON in produzione.
- **Redaction** (`[REDACTED]`): `req.headers.authorization`, `req.headers.cookie`, `*.password`, `*.passwordHash`,
  `*.token`, `*.fiscalCode`, `*.pan`, `*.cvv`.
- `requestId` genera `crypto.randomUUID()`, lo salva in `req.id` e lo restituisce nell'header `X-Request-Id`
  (esposto anche via CORS al frontend). pino-http riusa lo stesso id (`genReqId`), e così fa l'errorHandler:

```
[16:50:40.028] WARN: Account con id xyz non trovato
    reqId: "6755a624-0eac-4d71-b538-f73059e05db8"
[16:50:40.029] WARN: GET /api/accounts/xyz → 404
    req: { "id": "6755a624-0eac-4d71-b538-f73059e05db8", ..., "authorization": "[REDACTED]", "cookie": "[REDACTED]" }
```

## Pipeline middleware (`src/app.ts`)

1. `requestId`: `req.id` + `X-Request-Id`
2. `requestLogger` (pino-http): primo dopo `requestId`, così logga anche le richieste rifiutate dai middleware successivi
3. `helmet()`
4. `cors(...)`
5. `express.json({ limit: "100kb" })`
6. router `/api/accounts` e `/api/customers` (`validate` → `asyncHandler(controller)`)
7. `notFoundHandler` + `errorHandler` (sempre per ultimi)

## Endpoint

Risposte di successo: `{ "data": ... }`. Errori: `{ "error": { "code", "message", "details"? } }`.

| Metodo | Path                  | Successo | Errori        |
|--------|-----------------------|----------|---------------|
| GET    | `/api/accounts`       | 200      |               |
| GET    | `/api/accounts/:id`   | 200      | 404           |
| POST   | `/api/accounts`       | 201      | 422, 409 IBAN |
| PUT    | `/api/accounts/:id`   | 200      | 422, 404      |
| DELETE | `/api/accounts/:id`   | 204      | 404           |
| GET    | `/api/customers`      | 200      |               |
| GET    | `/api/customers/:id`  | 200      | 404           |
| POST   | `/api/customers`      | 201      | 422, 409 CF   |
| PUT    | `/api/customers/:id`  | 200      | 422, 404      |
| DELETE | `/api/customers/:id`  | 204      | 404           |

**Account**: `id, ownerId, iban, type (CHECKING|SAVINGS|BUSINESS), balance, status (ACTIVE|BLOCKED|CLOSED), createdAt`.

**Customer**: `id, fiscalCode, firstName, lastName, email, phone, status (ACTIVE|INACTIVE)`.

## Verifica

```bash
curl -i -X POST http://localhost:3000/api/accounts -H "Content-Type: application/json" \
  -d '{"ownerId":"non-uuid","iban":"IT00","type":"DEPOSIT","initialBalance":-50}'
# 422 {"error":{"code":"VALIDATION_ERROR","message":"Dati non validi","details":[
#   {"field":"ownerId","message":"ownerId deve essere un UUID"},
#   {"field":"iban","message":"L'IBAN italiano è di 27 caratteri"}, ...,
#   {"field":"initialBalance","message":"Il saldo iniziale non può essere negativo"}]}}

curl -i http://localhost:3000/api/accounts/non-esiste
# 404 {"error":{"code":"NOT_FOUND","message":"Account con id non-esiste non trovato"}}
```

- **REST Client**: apri `requests/liparibank.http` e clicca *Send Request* in ordine (i POST salvano l'id per le richieste successive).
- **Postman**: *Import* → `postman/LipariBank.postman_collection.json`, poi *Run collection*. Ordine: Customer → Account → Errori → Cleanup;
  il customer creato diventa l'`ownerId` dell'account. Risultato atteso: 15 richieste, 33 assertion verdi
  (`npx newman run postman/LipariBank.postman_collection.json`).
