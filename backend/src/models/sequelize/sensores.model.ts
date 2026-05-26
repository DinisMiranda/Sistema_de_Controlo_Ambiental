import { DataTypes, Sequelize } from "sequelize";

export function initSensoresModel(sequelize: Sequelize) {
  return sequelize.define(
    "Sensor",
    {
      id_sensor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      tipo_sensor: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      localizacao: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      data_instalacao: {
        type: DataTypes.DATEONLY,
      },
      Tipos_classe: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      Tipos_tipo: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
    },
    {
      tableName: "sensores",
      timestamps: false,
    }
  );
}
