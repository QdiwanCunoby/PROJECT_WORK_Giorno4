// Stampa "[METHOD] URL - status (tempo ms)" quando la response è stata inviata
import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${ms.toFixed(1)} ms)`);
  });

  next();
};
