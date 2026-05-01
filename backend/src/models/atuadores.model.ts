import { db } from "../lib/db.js";

export async function findAllAtuadores() {
  const [rows] = await db.query(
    "SELECT id_atuador, nome, tipo_atuador, localizacao, estado FROM atuadores ORDER BY id_atuador"
  );
  return rows;
}

export async function findAtuadorById(id: number) {
  const [rows] = await db.query(
    "SELECT id_atuador, nome, tipo_atuador, localizacao, estado FROM atuadores WHERE id_atuador = ?",
    [id]
  );
  const arr = rows as unknown[];
  return arr[0] ?? null;
}
