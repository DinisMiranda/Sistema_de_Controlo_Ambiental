import { db } from "../lib/db.js";

export async function findAllSensores() {
  const [rows] = await db.query(
    "SELECT id_sensor, nome, tipo_sensor, localizacao, estado, data_instalacao FROM sensores ORDER BY id_sensor"
  );
  return rows;
}

export async function findSensorById(id: number) {
  const [rows] = await db.query(
    "SELECT id_sensor, nome, tipo_sensor, localizacao, estado, data_instalacao FROM sensores WHERE id_sensor = ?",
    [id]
  );
  const arr = rows as unknown[];
  return arr[0] ?? null;
}
