import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { models } from "../models/sequelize/index.js";

export const usersRouter = Router();

// List all users (admin only)
usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await models.Utilizador.findAll({
    attributes: ["id_administrador", "nome", "email", "admin", "data_criacao"],
  });
  res.json(users);
});

// Delete a user (admin only)
usersRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const deleted = await models.Utilizador.destroy({
    where: { id_administrador: req.params.id },
  });
  if (!deleted) return res.status(404).json({ error: "Utilizador não encontrado" });
  res.status(204).send();
});