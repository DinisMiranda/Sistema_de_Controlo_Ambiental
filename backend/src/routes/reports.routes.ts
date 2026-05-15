import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { RegistosConsumo } from "../models/sequelize/index.js";

export const reportsRouter = Router();

reportsRouter.get("/", requireAuth, async (_req, res) => {
  try {
    const reports = await RegistosConsumo.findAll();

    res.json(reports);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao obter relatórios",
    });
  }
});