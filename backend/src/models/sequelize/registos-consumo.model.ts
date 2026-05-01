import { DataTypes, Sequelize } from "sequelize";

export function initRegistosConsumoModel(sequelize: Sequelize) {
  return sequelize.define(
    "RegistoConsumo",
    {
      id_registo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      consumo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unidade: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      periodo_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      periodo_fim: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      leituras_sensor_id_leitura: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "registos_consumo",
      timestamps: false,
    }
  );
}
