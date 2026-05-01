import { Router } from "express";
import { getAllSensores, getSensorById } from "../controllers/sensores.controller.js";

export const sensoresRouter = Router();

sensoresRouter.get("/", getAllSensores);
sensoresRouter.get("/:id", getSensorById);
