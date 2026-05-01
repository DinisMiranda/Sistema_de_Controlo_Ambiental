import { Request, Response } from "express";
import { createHash } from "crypto";
import { models } from "../models/sequelize/index.js";

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function buildToken(id: number, admin: boolean) {
  return Buffer.from(JSON.stringify({ id, admin }), "utf-8").toString("base64url");
}

export async function register(req: Request, res: Response) {
  const { nome, email, password } = req.body;

  if (!nome || !email || !password) {
    return res.status(400).json({ error: "nome, email e password são obrigatórios" });
  }

  const existing = await models.Utilizador.findOne({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: "email já existe" });
  }

  const user = await models.Utilizador.create({
    nome,
    email,
    palavra_passe_hash: hashPassword(password),
    data_criacao: new Date(),
    admin: false,
  });

  res.status(201).json({
    id: user.get("id_administrador"),
    nome: user.get("nome"),
    email: user.get("email"),
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email e password são obrigatórios" });
  }

  const user = await models.Utilizador.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "credenciais inválidas" });
  }

  const validPassword = user.get("palavra_passe_hash") === hashPassword(password);
  if (!validPassword) {
    return res.status(401).json({ error: "credenciais inválidas" });
  }

  const id = Number(user.get("id_administrador"));
  const admin = Boolean(user.get("admin"));
  const token = buildToken(id, admin);

  res.json({
    token,
    user: {
      id,
      nome: user.get("nome"),
      email: user.get("email"),
      admin,
    },
  });
}

export function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "token em falta" });
  }
  res.json({ user: req.user });
}
