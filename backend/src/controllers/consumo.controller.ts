import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

export async function getConsumoBySensor(req: Request, res: Response) {
  const idSensor = Number(req.params.id);
  if (Number.isNaN(idSensor)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const leituras = await models.LeituraSensor.findAll({
    where: { id_sensor: idSensor },
    attributes: ["id_leitura"],
  });
  const leituraIds = leituras.map((item) => Number(item.get("id_leitura")));

  if (leituraIds.length === 0) {
    return res.json([]);
  }

  const rows = await models.RegistoConsumo.findAll({
    where: { leituras_sensor_id_leitura: leituraIds },
    order: [["periodo_inicio", "DESC"]],
  });
  res.json(rows);
}

export async function getAllConsumo(_req: Request, res: Response) {
  const rows = await models.RegistoConsumo.findAll({
    order: [["periodo_inicio", "DESC"]],
  });
  res.json(rows);
}
