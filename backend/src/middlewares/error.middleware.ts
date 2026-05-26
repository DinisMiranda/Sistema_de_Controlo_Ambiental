import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/error.utils.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`) as ApiError;
  error.status = 404;
  next(error);
}

export function errorHandler(error: ApiError, _req: Request, res: Response, _next: NextFunction) {
  const status = error.status ?? 500;
  const description =
    error instanceof SyntaxError && status === 400
      ? "Invalid JSON payload"
      : error.message || "Internal server error";

  res.status(status).json({
    description,
    ...(error.errors ? { errors: error.errors } : {}),
  });
}
