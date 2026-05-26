export type ApiError = Error & {
  status?: number;
  errors?: unknown;
};

export function createError(status: number, description: string, errors?: unknown): ApiError {
  const error = new Error(description) as ApiError;
  error.status = status;
  error.errors = errors;
  return error;
}

export function validationError(errors: unknown) {
  return createError(400, "Validation failed", errors);
}

export function notFoundError(description: string) {
  return createError(404, description);
}
