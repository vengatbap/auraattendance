export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_SERVER_ERROR", details: unknown = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: unknown = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Unauthorized access. Please login.") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "You do not have permission to perform this action.") {
    super(message, 403, "UNAUTHORIZED");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found.") {
    super(message, 404, "NOT_FOUND");
  }
}
