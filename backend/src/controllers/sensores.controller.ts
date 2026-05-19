import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

export async function getAllSensores(_req, res) {
  res.json([
    // SALA 101
    {
      id_sensor: 1,
      localizacao: "Sala 101",
      tipo_sensor: "temperatura",
    },
    {
      id_sensor: 2,
      localizacao: "Sala 101",
      tipo_sensor: "humidade",
    },
    {
      id_sensor: 3,
      localizacao: "Sala 101",
      tipo_sensor: "iluminacao",
    },

    // SALA 102
    {
      id_sensor: 4,
      localizacao: "Sala 102",
      tipo_sensor: "temperatura",
    },
    {
      id_sensor: 5,
      localizacao: "Sala 102",
      tipo_sensor: "humidade",
    },
    {
      id_sensor: 6,
      localizacao: "Sala 102",
      tipo_sensor: "iluminacao",
    },

    // SALA 201
    {
      id_sensor: 7,
      localizacao: "Sala 201",
      tipo_sensor: "temperatura",
    },
    {
      id_sensor: 8,
      localizacao: "Sala 201",
      tipo_sensor: "humidade",
    },
    {
      id_sensor: 9,
      localizacao: "Sala 201",
      tipo_sensor: "iluminacao",
    },

    // Auditorio
    {
      id_sensor: 10,
      localizacao: "Auditório",
      tipo_sensor: "temperatura",
    },
    {
      id_sensor: 11,
      localizacao: "Auditório",
      tipo_sensor: "humidade",
    },
    {
      id_sensor: 12,
      localizacao: "Auditório",
      tipo_sensor: "iluminacao",
    },

    // Laboratório
    {
      id_sensor: 13,
      localizacao: "Laboratório",
      tipo_sensor: "temperatura",
    },
    {
      id_sensor: 14,
      localizacao: "Laboratório",
      tipo_sensor: "humidade",
    },
    {
      id_sensor: 15,
      localizacao: "Laboratório",
      tipo_sensor: "iluminacao",
    },
  ]);
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
