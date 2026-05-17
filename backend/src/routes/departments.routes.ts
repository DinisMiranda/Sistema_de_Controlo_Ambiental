import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { db } from "../lib/db.js";

export const departmentsRouter = Router();

departmentsRouter.get("/", async (_req, res) => {
  try {
    const departments = await db.query(
      "SELECT id, name FROM departments ORDER BY name"
    );

    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

departmentsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  // Add real DB logic here later
  res.status(201).json({ id: Date.now(), name });
});