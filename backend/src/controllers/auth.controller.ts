import { Request, Response } from "express";
import { createHash } from "crypto";
import { models } from "../models/sequelize/index.js";

function hashPassword(password: string) {
  return createHash("sha256")
    .update(password)
    .digest("hex");
}

function buildToken(id: number, admin: boolean) {
  return Buffer.from(
    JSON.stringify({ id, admin }),
    "utf-8",
  ).toString("base64url");
}

// ============================================
// REGISTER
// ============================================

export async function register(req: Request, res: Response) {
  try {
    const { nome, email, password } = req.body;

    // Validate required fields
    if (!nome || !email || !password) {
      return res.status(400).json({
        error: "nome, email e password são obrigatórios",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Email inválido",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: "A password deve ter pelo menos 6 caracteres",
      });
    }

    // Check if email already exists
    const existing = await models.Utilizador.findOne({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        error: "email já existe",
      });
    }

    // Create user
    const user = await models.Utilizador.create({
      nome,
      email,
      palavra_passe_hash: hashPassword(password),
      data_criacao: new Date(),
      admin: false,
    });

    return res.status(201).json({
      message: "Utilizador criado com sucesso",
      user: {
        id: user.get("id_administrador"),
        nome: user.get("nome"),
        email: user.get("email"),
        admin: user.get("admin"),
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
}

// ============================================
// LOGIN
// ============================================

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "email e password são obrigatórios",
      });
    }

    // Find user
    const user = await models.Utilizador.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // Validate password
    const validPassword =
      user.get("palavra_passe_hash") === hashPassword(password);

    if (!validPassword) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // Generate token
    const id = Number(user.get("id_administrador"));
    const admin = Boolean(user.get("admin"));
    const token = buildToken(id, admin);

    return res.json({
      message: "Login efetuado com sucesso",
      token,
      user: {
        id,
        nome: user.get("nome"),
        email: user.get("email"),
        admin,
        role: admin ? "Admin" : "User",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
}

// ============================================
// ME
// ============================================

export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "token em falta",
      });
    }

    const user = await models.Utilizador.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({ error: "Utilizador não encontrado" });
    }

    const admin = Boolean(user.get("admin"));
    return res.json({
      user: {
        id: Number(user.get("id_administrador")),
        nome: user.get("nome"),
        email: user.get("email"),
        admin,
        role: admin ? "Admin" : "User",
      },
    });
  } catch (err) {
    console.error("ME ERROR:", err);

    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
}