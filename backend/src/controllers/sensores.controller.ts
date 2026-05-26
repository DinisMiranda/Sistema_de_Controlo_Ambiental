import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

function formatSensor(sensor: { get: (key: string) => unknown }) {
  const idSensor = Number(sensor.get("id_sensor"));
  return {
    id_sensor: idSensor,
    id: idSensor,
    nome: sensor.get("nome"),
    tipo_sensor: sensor.get("tipo_sensor"),
    localizacao: sensor.get("localizacao"),
    estado: sensor.get("estado"),
    data_instalacao: sensor.get("data_instalacao"),
    Tipos_classe: sensor.get("Tipos_classe"),
    Tipos_tipo: sensor.get("Tipos_tipo"),
  };
}

export async function getAllSensores(_req: Request, res: Response) {
  const rows = await models.Sensor.findAll({ order: [["id_sensor", "ASC"]] });
  res.json(rows.map(formatSensor));
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
  res.json(formatSensor(sensor));
}

export async function getLatestReading(req: Request, res: Response) {
  const idSensor = Number(req.params.id);
  if (Number.isNaN(idSensor)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const latest = await models.LeituraSensor.findOne({
    where: { id_sensor: idSensor },
    order: [["timestamp_leitura", "DESC"]],
  });

  if (!latest) {
    return res.status(404).json({ message: "No readings found" });
  }

  res.json(latest);
}

export async function createSensor(req: Request, res: Response) {
  try {
    const { nome, tipo_sensor, localizacao } = req.body;

    if (!nome || !tipo_sensor || !localizacao) {
      return res.status(400).json({
        error: "Campos obrigatórios em falta",
      });
    }

    const sensor = await models.Sensor.create({
      nome: req.body.nome,
      tipo_sensor: req.body.tipo_sensor,
      localizacao: req.body.localizacao,
      estado: req.body.estado ?? "ativo",
      Tipos_classe: req.body.Tipos_classe ?? "Sensor",
      Tipos_tipo: req.body.Tipos_tipo ?? req.body.tipo_sensor,
      data_instalacao: req.body.data_instalacao ?? null,
    });

    return res.status(201).json(formatSensor(sensor));
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Erro ao criar sensor";
    return res.status(400).json({ error: message });
  }
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
  res.json(formatSensor(sensor));
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
