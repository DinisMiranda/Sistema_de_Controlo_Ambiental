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
  try {
    const { nome, tipo_atuador, localizacao } = req.body;

    if (!nome || !tipo_atuador || !localizacao) {
      return res.status(400).json({
        error: "Campos obrigatórios em falta",
      });
    }

    const atuador = await models.Atuador.create({
      nome: nome,
      tipo_atuador: tipo_atuador,
      localizacao: localizacao,
    });

    return res.status(201).json(atuador);
  } catch (err: any) {
    console.error(err);

    return res.status(400).json({
      error: err.message,
    });
  }
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
