import { Router } from "express";
import {
  createTipo,
  deleteTipo,
  getAllTipos,
  getTipoById,
  patchTipo,
} from "../controllers/tipos.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validateRequiredBody } from "../middlewares/validate-body.middleware.js";

export const tiposRouter = Router();

tiposRouter.use(requireAuth, requireAdmin);
tiposRouter.get("/", getAllTipos);
tiposRouter.get("/:classe/:tipo", getTipoById);
tiposRouter.post("/", validateRequiredBody(["classe", "tipo", "descricao"]), createTipo);
tiposRouter.patch("/:classe/:tipo", patchTipo);
tiposRouter.delete("/:classe/:tipo", deleteTipo);
