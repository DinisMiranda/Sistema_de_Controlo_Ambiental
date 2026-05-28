export function notFoundHandler(req, _res, next) {
    const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
    error.status = 404;
    next(error);
}
export function errorHandler(error, _req, res, _next) {
    const status = error.status ?? 500;
    const description = error instanceof SyntaxError && status === 400
        ? "Invalid JSON payload"
        : error.message || "Internal server error";
    res.status(status).json({
        description,
        ...(error.errors ? { errors: error.errors } : {}),
    });
}
