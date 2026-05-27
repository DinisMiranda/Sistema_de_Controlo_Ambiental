import { Router } from "express";
import { createUtilizador } from "../controllers/auth.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { models } from "../models/sequelize/index.js";

export const usersRouter = Router();

// Create user (admin only; can set admin flag)
usersRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { nome, email, password, admin } = req.body;
    const user = await createUtilizador({
      nome,
      email,
      password,
      admin: admin === true || admin === 1 || admin === "1" || admin === "true",
    });

    res.status(201).json({
      message: "Utilizador criado com sucesso",
      user: {
        id: user.get("id_administrador"),
        nome: user.get("nome"),
        email: user.get("email"),
        admin: user.get("admin"),
      },
    });
  } catch (err) {
    const error = err as Error & { status?: number };
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("CREATE USER ERROR:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// List all users (admin only)
usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await models.Utilizador.findAll({
      attributes: ["id_administrador", "nome", "email", "admin", "data_criacao"],
    });
    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Delete a user (admin only)
usersRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const deleted = await models.Utilizador.destroy({
      where: { id_administrador: id },
    });
    if (!deleted) return res.status(404).json({ error: "Utilizador não encontrado" });
    res.status(204).send();
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});