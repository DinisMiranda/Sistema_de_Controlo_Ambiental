import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
  process.env.DB_NAME ?? "sistema_controlo_ambiental2",
  process.env.DB_USER ?? "root",
  process.env.DB_PASSWORD || undefined,
  {
    host: process.env.DB_HOST ?? "127.0.0.1",
    dialect: (process.env.DB_DIALECT as "mysql" | undefined) ?? "mysql",
  },
);

export async function authenticateSequelize() {
  await sequelize.authenticate();
}
