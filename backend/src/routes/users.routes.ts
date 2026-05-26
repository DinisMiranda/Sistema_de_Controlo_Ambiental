import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { models } from "../models/sequelize/index.js";

export const usersRouter = Router();

// List all users (admin only)
usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await models.Utilizador.findAll({
      attributes: ["id_administrador", "nome", "email", "admin", "department", "data_criacao"],
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

usersRouter.put("/:id/department", async (req, res) => {
  try {
    const { id } = req.params;
    const { department } = req.body;

    const user = await models.Utilizador.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await user.save();

    res.json({
      message: "Department updated",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});