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

sensoresRouter.get("/:id/latest", async (req, res) => {
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

sensoresRouter.get("/:id/readings", async (req, res) => {
  const sensorId = Number(req.params.id);

  const fakeReadings = {
    1: [{ valor: 22.5, unidade: "°C" }],
    2: [{ valor: 55, unidade: "%" }],
    3: [{ valor: 78, unidade: "lux" }],

    4: [{ valor: 24.1, unidade: "°C" }],
    5: [{ valor: 48, unidade: "%" }],
    6: [{ valor: 65, unidade: "lux" }],

    7: [{ valor: 19.8, unidade: "°C" }],
    8: [{ valor: 61, unidade: "%" }],
    9: [{ valor: 82, unidade: "lux" }],

    10: [{ valor: 27.3, unidade: "°C" }],
    11: [{ valor: 70, unidade: "%" }],
    12: [{ valor: 40, unidade: "lux" }],

    13: [{ valor: 21.7, unidade: "°C" }],
    14: [{ valor: 52, unidade: "%" }],
    15: [{ valor: 90, unidade: "lux" }],
  };

  res.json(fakeReadings[sensorId] || []);
});
