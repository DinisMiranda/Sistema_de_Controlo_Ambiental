import { Router } from "express";
import { createAcao, getAcoes } from "../controllers/acoes.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

export const acoesRouter = Router();

acoesRouter.get("/:id/actions", getAcoes);
acoesRouter.post("/:id/actions", requireAuth, requireAdmin, createAcao);
