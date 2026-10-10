// Errori applicativi: il Service lancia, l'errorHandler traduce in status HTTP
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(400, "VALIDATION_ERROR", message); }
}

export class NotFoundError extends AppError {
  constructor(message: string) { super(404, "NOT_FOUND", message); }
}

export class ConflictError extends AppError {
  constructor(message: string) { super(409, "CONFLICT", message); }
}
