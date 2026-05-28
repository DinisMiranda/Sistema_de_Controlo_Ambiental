import { createHash } from "crypto";
import { models } from "../models/sequelize/index.js";
function hashPassword(password) {
    return createHash("sha256")
        .update(password)
        .digest("hex");
}
function buildToken(id, admin) {
    return Buffer.from(JSON.stringify({ id, admin }), "utf-8").toString("base64url");
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateUserInput(nome, email, password) {
    if (!nome || !email || !password) {
        return "nome, email e password são obrigatórios";
    }
    if (typeof nome !== "string" || typeof email !== "string" || typeof password !== "string") {
        return "dados inválidos";
    }
    if (!EMAIL_REGEX.test(email)) {
        return "Email inválido";
    }
    if (password.length < 6) {
        return "A password deve ter pelo menos 6 caracteres";
    }
    return null;
}
export async function createUtilizador(input) {
    const validationError = validateUserInput(input.nome, input.email, input.password);
    if (validationError) {
        const err = new Error(validationError);
        err.status = 400;
        throw err;
    }
    const existing = await models.Utilizador.findOne({
        where: { email: input.email },
    });
    if (existing) {
        const err = new Error("email já existe");
        err.status = 409;
        throw err;
    }
    return models.Utilizador.create({
        nome: input.nome.trim(),
        email: input.email.trim(),
        palavra_passe_hash: hashPassword(input.password),
        data_criacao: new Date(),
        admin: Boolean(input.admin),
    });
}
function formatUserResponse(user) {
    return {
        id: user.get("id_administrador"),
        nome: user.get("nome"),
        email: user.get("email"),
        admin: user.get("admin"),
    };
}
// ============================================
// REGISTER
// ============================================
export async function register(req, res) {
    try {
        const { nome, email, password } = req.body;
        const user = await createUtilizador({ nome, email, password, admin: false });
        return res.status(201).json({
            message: "Utilizador criado com sucesso",
            user: formatUserResponse(user),
        });
    }
    catch (err) {
        const error = err;
        if (error.status) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}
// ============================================
// LOGIN
// ============================================
export async function login(req, res) {
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
        const validPassword = user.get("palavra_passe_hash") === hashPassword(password);
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
    }
    catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({
            error: "Erro interno do servidor",
        });
    }
}
// ============================================
// ME
// ============================================
export async function me(req, res) {
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
    }
    catch (err) {
        console.error("ME ERROR:", err);
        return res.status(500).json({
            error: "Erro interno do servidor",
        });
    }
}
