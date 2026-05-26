import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

export async function createAcao(req: Request, res: Response) {
  const idAtuador = Number(req.params.id);
  if (Number.isNaN(idAtuador)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const { tipo_acao, valor_aplicado, motivo, Tipos_classe, Tipos_tipo } = req.body;
  if (!tipo_acao || !valor_aplicado || !Tipos_classe || !Tipos_tipo) {
    return res
      .status(400)
      .json({ error: "tipo_acao, valor_aplicado, Tipos_classe e Tipos_tipo são obrigatórios" });
  }

  const created = await models.AcaoSistema.create({
    id_atuador: idAtuador,
    tipo_acao,
    valor_aplicado,
    motivo: motivo ?? null,
    timestamp_acao: new Date(),
    Tipos_classe,
    Tipos_tipo,
  });
  res.status(201).json(created);
}

export async function getAcoes(req: Request, res: Response) {
  const idAtuador = Number(req.params.id);
  if (Number.isNaN(idAtuador)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const rows = await models.AcaoSistema.findAll({
    where: { id_atuador: idAtuador },
    order: [["timestamp_acao", "DESC"]],
  });
  res.json(rows);
}
