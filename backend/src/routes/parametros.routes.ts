import { Router } from "express";
import {
  createParametro,
  getParametros,
  patchParametro,
} from "../controllers/parametros.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validateRequiredBody } from "../middlewares/validate-body.middleware.js";

export const parametrosRouter = Router();

parametrosRouter.use(requireAuth, requireAdmin);
parametrosRouter.get("/", getParametros);
parametrosRouter.post(
  "/",
  validateRequiredBody(["nome_parametro", "valor_parametro", "atuadores_id_atuador"]),
  createParametro
);
parametrosRouter.patch("/:id", patchParametro);
