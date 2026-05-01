import { DataTypes, Sequelize } from "sequelize";

export function initLeiturasSensorModel(sequelize: Sequelize) {
  return sequelize.define(
    "LeituraSensor",
    {
      id_leitura: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      id_sensor: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unidade: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      timestamp_leitura: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "leituras_sensor",
      timestamps: false,
    }
  );
}
