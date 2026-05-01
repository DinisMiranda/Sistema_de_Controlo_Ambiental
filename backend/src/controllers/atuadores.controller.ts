import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

export async function getAllAtuadores(_req: Request, res: Response) {
  const atuadores = await models.Atuador.findAll({ order: [["id_atuador", "ASC"]] });
  res.json(atuadores);
}

export async function getAtuadorById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const atuador = await models.Atuador.findByPk(id);
  if (!atuador) {
    return res.status(404).json({ error: "Atuador não encontrado" });
  }
  res.json(atuador);
}

export async function createAtuador(req: Request, res: Response) {
  const created = await models.Atuador.create(req.body);
  res.status(201).json(created);
}

export async function patchAtuador(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const atuador = await models.Atuador.findByPk(id);
  if (!atuador) {
    return res.status(404).json({ error: "Atuador não encontrado" });
  }
  await atuador.update(req.body);
  res.json(atuador);
}

export async function deleteAtuador(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const deleted = await models.Atuador.destroy({ where: { id_atuador: id } });
  if (!deleted) {
    return res.status(404).json({ error: "Atuador não encontrado" });
  }
  res.status(204).send();
}
