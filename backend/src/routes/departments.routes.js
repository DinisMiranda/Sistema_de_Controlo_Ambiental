import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { createCasa, listDepartments } from "../controllers/casas.controller.js";
export const departmentsRouter = Router();
departmentsRouter.get("/", listDepartments);
departmentsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
    const { name, morada, codigo_postal } = req.body;
    if (!name) {
        return res.status(400).json({ error: "name is required" });
    }
    req.body = {
        nome: name,
        morada: morada ?? "—",
        codigo_postal: codigo_postal ?? "0000-000",
    };
    return createCasa(req, res);
});
