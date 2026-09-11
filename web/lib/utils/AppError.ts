/**
 * APIx Web — Custom Application Error
 *
 * Used throughout the service layer to throw structured errors
 * that route handlers can catch and convert to proper HTTP responses.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;

    // Maintain proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Factory for 404 errors.
   */
  static notFound(message: string = "Resource not found"): AppError {
    return new AppError(message, "NOT_FOUND", 404);
  }

  /**
   * Factory for 400 validation errors.
   */
  static badRequest(message: string): AppError {
    return new AppError(message, "BAD_REQUEST", 400);
  }

  /**
   * Factory for 500 internal errors.
   */
  static internal(message: string = "Internal server error"): AppError {
    return new AppError(message, "INTERNAL_ERROR", 500);
  }
}
