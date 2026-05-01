import { Router } from "express";
import {
  createAtuador,
  deleteAtuador,
  getAllAtuadores,
  getAtuadorById,
  patchAtuador,
} from "../controllers/atuadores.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

export const atuadoresRouter = Router();

atuadoresRouter.get("/", getAllAtuadores);
atuadoresRouter.get("/:id", getAtuadorById);
atuadoresRouter.post("/", requireAuth, requireAdmin, createAtuador);
atuadoresRouter.patch("/:id", requireAuth, requireAdmin, patchAtuador);
atuadoresRouter.delete("/:id", requireAuth, requireAdmin, deleteAtuador);
