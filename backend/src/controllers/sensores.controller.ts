import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

export async function getAllSensores(_req: Request, res: Response) {
  const sensores = await models.Sensor.findAll({ order: [["id_sensor", "ASC"]] });
  res.json(sensores);
}

export async function getSensorById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const sensor = await models.Sensor.findByPk(id);
  if (!sensor) {
    return res.status(404).json({ error: "Sensor não encontrado" });
  }
  res.json(sensor);
}

export async function createSensor(req: Request, res: Response) {
  const created = await models.Sensor.create(req.body);
  res.status(201).json(created);
}

export async function patchSensor(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const sensor = await models.Sensor.findByPk(id);
  if (!sensor) {
    return res.status(404).json({ error: "Sensor não encontrado" });
  }
  await sensor.update(req.body);
  res.json(sensor);
}

export async function deleteSensor(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const deleted = await models.Sensor.destroy({ where: { id_sensor: id } });
  if (!deleted) {
    return res.status(404).json({ error: "Sensor não encontrado" });
  }
  res.status(204).send();
}
