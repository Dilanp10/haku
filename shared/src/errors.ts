/** Códigos estables que la UI/API puede mapear sin acoplarse a mensajes. */
export type ErrorCode =
  | "NOT_FOUND"
  | "VALIDATION"
  | "FORBIDDEN"
  | "CONFLICT"
  | "UNEXPECTED";

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND" as const;
}
export class ValidationError extends AppError {
  readonly code = "VALIDATION" as const;
  constructor(message: string, readonly issues?: unknown, cause?: unknown) {
    super(message, cause);
  }
}
export class ForbiddenError extends AppError {
  readonly code = "FORBIDDEN" as const;
}
export class ConflictError extends AppError {
  readonly code = "CONFLICT" as const;
}
export class UnexpectedError extends AppError {
  readonly code = "UNEXPECTED" as const;
}
