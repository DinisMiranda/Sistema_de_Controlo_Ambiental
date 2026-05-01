import { Router } from "express";
import {
  createSensor,
  deleteSensor,
  getAllSensores,
  getSensorById,
  patchSensor,
} from "../controllers/sensores.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validateRequiredBody } from "../middlewares/validate-body.middleware.js";

export const sensoresRouter = Router();

sensoresRouter.get("/", getAllSensores);
sensoresRouter.get("/:id", getSensorById);
sensoresRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validateRequiredBody(["nome", "tipo_sensor", "localizacao", "estado", "Tipos_classe", "Tipos_tipo"]),
  createSensor
);
sensoresRouter.patch("/:id", requireAuth, requireAdmin, patchSensor);
sensoresRouter.delete("/:id", requireAuth, requireAdmin, deleteSensor);
