import { DataTypes, Sequelize } from "sequelize";

export function initAtuadoresModel(sequelize: Sequelize) {
  return sequelize.define(
    "Atuador",
    {
      id_atuador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      tipo_atuador: {
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
      tableName: "atuadores",
      timestamps: false,
    }
  );
}
