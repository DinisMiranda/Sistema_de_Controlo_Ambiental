import { NextFunction, Request, Response } from "express";

export function validateRequiredBody(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "body inválido" });
    }

    const missing = fields.filter((field) => req.body[field] === undefined || req.body[field] === "");
    if (missing.length > 0) {
      return res.status(400).json({
        error: "validação falhou",
        fields: missing,
      });
    }

    next();
  };
}
