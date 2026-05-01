import { Request, Response, NextFunction } from "express";

function readBearerToken(req: Request) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }
  return authorization.slice("Bearer ".length).trim();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "token em falta" });
  }

  try {
    const payloadRaw = Buffer.from(token, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadRaw) as { id: number; admin: boolean };
    req.user = { id: Number(payload.id), admin: Boolean(payload.admin) };
    next();
  } catch {
    return res.status(401).json({ error: "token inválido" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "token em falta" });
  }
  if (!req.user.admin) {
    return res.status(403).json({ error: "acesso reservado a administradores" });
  }
  next();
}
