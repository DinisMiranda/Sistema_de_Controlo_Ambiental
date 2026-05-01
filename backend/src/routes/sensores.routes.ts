import { Router } from "express";
import {
  createSensor,
  deleteSensor,
  getAllSensores,
  getSensorById,
  patchSensor,
} from "../controllers/sensores.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

export const sensoresRouter = Router();

sensoresRouter.get("/", getAllSensores);
sensoresRouter.get("/:id", getSensorById);
sensoresRouter.post("/", requireAuth, requireAdmin, createSensor);
sensoresRouter.patch("/:id", requireAuth, requireAdmin, patchSensor);
sensoresRouter.delete("/:id", requireAuth, requireAdmin, deleteSensor);
