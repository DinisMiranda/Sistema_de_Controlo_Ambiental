import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";
import { roomKeyFromLocation } from "../utils/room.js";

function mapCasaForAdmin(casa: { get: (key: string) => unknown }) {
  return {
    id: casa.get("id_casa"),
    name: casa.get("nome"),
    location: casa.get("morada"),
    type: casa.get("codigo_postal"),
  };
}

/** Salas derivadas das localizações dos sensores (compatível com departamento/dashboard). */
export async function getSalasFromSensores(_req: Request, res: Response) {
  const sensores = await models.Sensor.findAll({
    attributes: ["localizacao"],
    group: ["localizacao"],
    order: [["localizacao", "ASC"]],
  });

  const salas = sensores.map((sensor) => {
    const localizacao = String(sensor.get("localizacao"));
    return {
      id: roomKeyFromLocation(localizacao),
      name: localizacao,
      location: localizacao,
      badge: "Ativo",
      type: "Ativo",
    };
  });

  res.json(salas);
}

export async function getSalaByKey(req: Request, res: Response) {
  const key = req.params.id;
  const sensores = await models.Sensor.findAll({
    order: [["localizacao", "ASC"]],
  });

  const match = sensores.find(
    (s) => roomKeyFromLocation(String(s.get("localizacao"))) === key,
  );

  if (!match) {
    return res.status(404).json({ error: "Sala não encontrada." });
  }

  const localizacao = String(match.get("localizacao"));
  res.json({
    id: key,
    name: localizacao,
    location: localizacao,
    badge: "Ativo",
    type: "Ativo",
  });
}

export async function listCasas(_req: Request, res: Response) {
  const rows = await models.Casa.findAll({ order: [["id_casa", "ASC"]] });
  res.json(rows.map(mapCasaForAdmin));
}

export async function getCasaById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const casa = await models.Casa.findByPk(id);
  if (!casa) {
    return res.status(404).json({ error: "Casa não encontrada" });
  }
  res.json(mapCasaForAdmin(casa));
}

