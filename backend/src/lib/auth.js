import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "8h";

function getSecret() {
    return process.env.JWT_SECRET ?? "change-me-in-production";
}

export function signToken(payload) {
    return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, getSecret());
    }
    catch {
        return null;
    }
}
