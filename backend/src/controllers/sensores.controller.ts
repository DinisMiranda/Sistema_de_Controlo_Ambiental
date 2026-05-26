import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

export async function getAllSensores(_req: Request, res: Response) {
  res.json([
    // SALA 101
    {
      id_sensor: 1,
      nome: "Sensor de Temperatura 1",
      localizacao: "Sala 101",
      tipo_sensor: "Temperatura",
    },
    {
      id_sensor: 2,
      nome: "Sensor de Humidade 1",
      localizacao: "Sala 101",
      tipo_sensor: "Humidade",
    },
    {
      id_sensor: 3,
      nome: "Sensor de Iluminação 1",
      localizacao: "Sala 101",
      tipo_sensor: "Iluminação",
    },

    // SALA 102
    {
      id_sensor: 4,
      nome: "Sensor de Temperatura 2",
      localizacao: "Sala 102",
      tipo_sensor: "Temperatura",
    },
    {
      id_sensor: 5,
      nome: "Sensor de Humidade 2",
      localizacao: "Sala 102",
      tipo_sensor: "Humidade",
    },
    {
      id_sensor: 6,
      nome: "Sensor de Iluminação 2",
      localizacao: "Sala 102",
      tipo_sensor: "Iluminação",
    },

    // SALA 201
    {
      id_sensor: 7,
      nome: "Sensor de Temperatura 3",
      localizacao: "Sala 201",
      tipo_sensor: "Temperatura",
    },
    {
      id_sensor: 8,
      nome: "Sensor de Humidade 3",
      localizacao: "Sala 201",
      tipo_sensor: "Humidade",
    },
    {
      id_sensor: 9,
      nome: "Sensor de Iluminação 3",
      localizacao: "Sala 201",
      tipo_sensor: "Iluminação",
    },

    // Auditorio
    {
      id_sensor: 10,
      nome: "Sensor de Temperatura 4",
      localizacao: "Auditório",
      tipo_sensor: "Temperatura",
    },
    {
      id_sensor: 11,
      nome: "Sensor de Humidade 4",
      localizacao: "Auditório",
      tipo_sensor: "Humidade",
    },
    {
      id_sensor: 12,
      nome: "Sensor de Iluminação 4",
      localizacao: "Auditório",
      tipo_sensor: "Iluminação",
    },

    // Laboratório
    {
      id_sensor: 13,
      nome: "Sensor de Temperatura 5",
      localizacao: "Laboratório",
      tipo_sensor: "Temperatura",
    },
    {
      id_sensor: 14,
      nome: "Sensor de Humidade 5",
      localizacao: "Laboratório",
      tipo_sensor: "Humidade",
    },
    {
      id_sensor: 15,
      nome: "Sensor de Iluminação 5",
      localizacao: "Laboratório",
      tipo_sensor: "Iluminação",
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

      estado: "ativo",
      Tipos_classe: "Sensor",
      Tipos_tipo: req.body.tipo_sensor,
    });

    return res.status(201).json(sensor);
  } catch (err: any) {
    console.error(err);

    return res.status(400).json({
      error: err.message,
    });
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
