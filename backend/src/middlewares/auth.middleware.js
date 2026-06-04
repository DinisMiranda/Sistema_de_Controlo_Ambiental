import { verifyToken } from "../lib/auth.js";
function readBearerToken(req) {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
        return null;
    }
    return authorization.slice("Bearer ".length).trim();
}
export function requireAuth(req, res, next) {
    const token = readBearerToken(req);
    if (!token) {
        return res.status(401).json({ error: "token em falta" });
    }
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: "token inválido" });
    }
    req.user = { id: Number(payload.id), admin: Boolean(payload.admin) };
    next();
}
export function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: "token em falta" });
    }
    if (!req.user.admin) {
        return res.status(403).json({ error: "acesso reservado a administradores" });
    }
    next();
}
