import { Request, Response } from "express";
import { findAllAtuadores, findAtuadorById } from "../models/atuadores.model.js";

export async function getAllAtuadores(_req: Request, res: Response) {
  try {
    const atuadores = await findAllAtuadores();
    res.json(atuadores);
  } catch {
    res.status(500).json({ error: "Erro ao obter atuadores" });
  }
}

export async function getAtuadorById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const atuador = await findAtuadorById(id);
    if (!atuador) {
      return res.status(404).json({ error: "Atuador não encontrado" });
    }
    res.json(atuador);
  } catch {
    res.status(500).json({ error: "Erro ao obter atuador" });
  }
}
