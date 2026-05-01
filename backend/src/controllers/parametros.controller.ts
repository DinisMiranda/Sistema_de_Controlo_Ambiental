import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

export async function getParametros(_req: Request, res: Response) {
  const rows = await models.ParametroAutomatico.findAll({
    order: [["data_atualizacao", "DESC"]],
  });
  res.json(rows);
}

export async function createParametro(req: Request, res: Response) {
  const { nome_parametro, valor_parametro, atuadores_id_atuador } = req.body;
  if (!nome_parametro || !valor_parametro || !atuadores_id_atuador) {
    return res.status(400).json({
      error: "nome_parametro, valor_parametro e atuadores_id_atuador são obrigatórios",
    });
  }
  const created = await models.ParametroAutomatico.create({
    nome_parametro,
    valor_parametro,
    descricao: req.body.descricao ?? null,
    data_atualizacao: new Date(),
    atuadores_id_atuador,
  });
  res.status(201).json(created);
}

export async function patchParametro(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const row = await models.ParametroAutomatico.findByPk(id);
  if (!row) {
    return res.status(404).json({ error: "Parâmetro não encontrado" });
  }
  await row.update({
    ...req.body,
    data_atualizacao: new Date(),
  });
  res.json(row);
}
