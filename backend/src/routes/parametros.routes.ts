import { Router } from "express";
import {
  createParametro,
  getParametros,
  patchParametro,
} from "../controllers/parametros.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

export const parametrosRouter = Router();

parametrosRouter.use(requireAuth, requireAdmin);
parametrosRouter.get("/", getParametros);
parametrosRouter.post("/", createParametro);
parametrosRouter.patch("/:id", patchParametro);
