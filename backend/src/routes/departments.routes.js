import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { createDepartment, listDepartments } from "../controllers/casas.controller.js";
export const departmentsRouter = Router();
departmentsRouter.get("/", listDepartments);
departmentsRouter.post("/", requireAuth, requireAdmin, createDepartment);
