import { Sequelize } from "sequelize";
export const sequelize = new Sequelize(process.env.DB_NAME ?? "sistema_controlo_ambiental2", process.env.DB_USER ?? "root", process.env.DB_PASSWORD || undefined, {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT ?? "mysql",
    dialectOptions: {
        charset: "utf8mb4",
    },
    define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
    },
});
export async function authenticateSequelize() {
    await sequelize.authenticate();
}
