import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

export const departmentsRouter = Router();

departmentsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  // Add real DB logic here later
  res.status(201).json({ id: Date.now(), name });
});