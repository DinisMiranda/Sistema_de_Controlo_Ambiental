import { Router } from "express";
import { getAllConsumo, getConsumoBySensor } from "../controllers/consumo.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

export const consumoRouter = Router();

consumoRouter.get("api/consumo/sensors/:id/consumption", getConsumoBySensor);
consumoRouter.get("api/consumo/consumption", requireAuth, requireAdmin, getAllConsumo);
