import { Router } from "express";
import { getSalaByKey, getSalasFromSensores } from "../controllers/casas.controller.js";
export const roomsRouter = Router();
roomsRouter.get("/", getSalasFromSensores);
roomsRouter.get("/:id", getSalaByKey);
