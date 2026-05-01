import { Router } from "express";
import { createLeitura, getLeituras } from "../controllers/leituras.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validateRequiredBody } from "../middlewares/validate-body.middleware.js";

export const leiturasRouter = Router();

leiturasRouter.get("/:id/readings", getLeituras);
leiturasRouter.post(
  "/:id/readings",
  requireAuth,
  requireAdmin,
  validateRequiredBody(["valor", "unidade"]),
  createLeitura
);
