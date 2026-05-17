import { Router } from "express";
import { db } from "../lib/db.js";
import {
  createSensor,
  deleteSensor,
  getAllSensores,
  getSensorById,
  patchSensor,
} from "../controllers/sensores.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validateRequiredBody } from "../middlewares/validate-body.middleware.js";

const router = Router();
export const sensoresRouter = Router();

sensoresRouter.get("/", getAllSensores);
sensoresRouter.get("/:id", getSensorById);
sensoresRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validateRequiredBody([
    "nome",
    "tipo_sensor",
    "localizacao",
    "estado",
    "Tipos_classe",
    "Tipos_tipo",
  ]),
  createSensor,
);
sensoresRouter.patch("/:id", requireAuth, requireAdmin, patchSensor);
sensoresRouter.delete("/:id", requireAuth, requireAdmin, deleteSensor);

router.get("/:id/latest", async (req, res) => {
  try {
    const sensorId = Number(req.params.id);

    const result = await db.query(
      `
      SELECT *
      FROM readings
      WHERE sensorId = ?
      ORDER BY timestamp DESC
      LIMIT 1
      `,
      [sensorId],
    );

    const latestReading = result[0];

    if (!latestReading) {
      return res.status(404).json({
        message: "No readings found",
      });
    }

    res.json(latestReading);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:id/readings", async (req, res) => {
  try {
    const sensorId = Number(req.params.id);

    const readings = await db.query(
      `
      SELECT *
      FROM readings
      WHERE sensorId = ?
      ORDER BY timestamp ASC
      LIMIT 50
      `,
      [sensorId],
    );

    res.json(readings);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});
