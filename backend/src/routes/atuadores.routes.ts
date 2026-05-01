import { Router } from "express";
import { getAllAtuadores, getAtuadorById } from "../controllers/atuadores.controller.js";

export const atuadoresRouter = Router();

atuadoresRouter.get("/", getAllAtuadores);
atuadoresRouter.get("/:id", getAtuadorById);
