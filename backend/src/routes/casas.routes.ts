import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import {
  createCasa,
  deleteCasa,
  getCasaById,
  listCasas,
  updateCasa,
} from "../controllers/casas.controller.js";

export const casasRouter = Router();

casasRouter.get("/", listCasas);
casasRouter.get("/:id", getCasaById);
casasRouter.post("/", requireAuth, requireAdmin, createCasa);
casasRouter.patch("/:id", requireAuth, requireAdmin, updateCasa);
casasRouter.delete("/:id", requireAuth, requireAdmin, deleteCasa);
