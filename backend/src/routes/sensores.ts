import { Router } from "express";
import { db } from "../lib/db.js";

export const sensoresRouter = Router();

// GET /api/sensores – listar sensores
sensoresRouter.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_sensor, nome, tipo_sensor, localizacao, estado, data_instalacao FROM sensores ORDER BY id_sensor"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter sensores" });
  }
});

// GET /api/sensores/:id – obter um sensor
sensoresRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    const [rows] = await db.query(
      "SELECT id_sensor, nome, tipo_sensor, localizacao, estado, data_instalacao FROM sensores WHERE id_sensor = ?",
      [id]
    );
    const arr = rows as unknown[];
    if (arr.length === 0) return res.status(404).json({ error: "Sensor não encontrado" });
    res.json(arr[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter sensor" });
  }
});
