export function createError(status, description, errors) {
    const error = new Error(description);
    error.status = status;
    error.errors = errors;
    return error;
}
export function validationError(errors) {
    return createError(400, "Validation failed", errors);
}
export function notFoundError(description) {
    return createError(404, description);
}
