import { Request, Response } from "express";
import { Op } from "sequelize";
import { models } from "../models/sequelize/index.js";

export async function createLeitura(req: Request, res: Response) {
  const idSensor = Number(req.params.id);
  if (Number.isNaN(idSensor)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const { valor, unidade } = req.body;
  if (valor === undefined || !unidade) {
    return res.status(400).json({ error: "valor e unidade são obrigatórios" });
  }
  const created = await models.LeituraSensor.create({
    id_sensor: idSensor,
    valor,
    unidade,
    timestamp_leitura: new Date(),
  });
  res.status(201).json(created);
}

export async function getLeituras(req: Request, res: Response) {
  const idSensor = Number(req.params.id);
  if (Number.isNaN(idSensor)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const where: Record<string, unknown> = { id_sensor: idSensor };
  const valueWhere: Record<symbol, number> = {};

  if (req.query.minValue) {
    valueWhere[Op.gte] = Number(req.query.minValue);
  }
  if (req.query.maxValue) {
    valueWhere[Op.lte] = Number(req.query.maxValue);
  }
  if (Object.getOwnPropertySymbols(valueWhere).length > 0) {
    where.valor = valueWhere;
  }
  if (req.query.start || req.query.end) {
    const timeWhere: Record<symbol, Date> = {};
    if (req.query.start) {
      timeWhere[Op.gte] = new Date(String(req.query.start));
    }
    if (req.query.end) {
      timeWhere[Op.lte] = new Date(String(req.query.end));
    }
    where.timestamp_leitura = timeWhere;
  }

  const rows = await models.LeituraSensor.findAll({
    where,
    order: [["timestamp_leitura", "DESC"]],
  });
  res.json(rows);
}
