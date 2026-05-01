import { Request, Response } from "express";
import { findAllSensores, findSensorById } from "../models/sensores.model.js";

export async function getAllSensores(_req: Request, res: Response) {
  try {
    const sensores = await findAllSensores();
    res.json(sensores);
  } catch {
    res.status(500).json({ error: "Erro ao obter sensores" });
  }
}

export async function getSensorById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const sensor = await findSensorById(id);
    if (!sensor) {
      return res.status(404).json({ error: "Sensor não encontrado" });
    }
    res.json(sensor);
  } catch {
    res.status(500).json({ error: "Erro ao obter sensor" });
  }
}
