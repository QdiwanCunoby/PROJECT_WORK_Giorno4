// Error handler centralizzato: 4 argomenti → Express lo riconosce come error middleware
import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors";
import { fail } from "../shared/apiResponse";

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.code, err.message));
    return;
  }

  // Body JSON malformato o troppo grande (sollevati da express.json())
  const httpErr = err as { type?: string; status?: number };
  if (httpErr.type === "entity.parse.failed") {
    res.status(400).json(fail("INVALID_JSON", "Body JSON non valido"));
    return;
  }
  if (httpErr.type === "entity.too.large") {
    res.status(413).json(fail("PAYLOAD_TOO_LARGE", "Body oltre il limite di 100kb"));
    return;
  }

  console.error(err);
  res.status(500).json(fail("INTERNAL_ERROR", "Errore interno del server"));
};
