import { Router } from "express";
import { db } from "../lib/db.js";

export const atuadoresRouter = Router();

// GET /api/atuadores – listar atuadores
atuadoresRouter.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_atuador, nome, tipo_atuador, localizacao, estado FROM atuadores ORDER BY id_atuador"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter atuadores" });
  }
});

// GET /api/atuadores/:id – obter um atuador
atuadoresRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    const [rows] = await db.query(
      "SELECT id_atuador, nome, tipo_atuador, localizacao, estado FROM atuadores WHERE id_atuador = ?",
      [id]
    );
    const arr = rows as unknown[];
    if (arr.length === 0) return res.status(404).json({ error: "Atuador não encontrado" });
    res.json(arr[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter atuador" });
  }
});
