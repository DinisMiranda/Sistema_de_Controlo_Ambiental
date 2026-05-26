import { DataTypes, Sequelize } from "sequelize";

export function initUtilizadoresModel(sequelize: Sequelize) {
  return sequelize.define(
    "Utilizador",
    {
      id_administrador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      palavra_passe_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      data_criacao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      tableName: "Utilizadores",
      timestamps: false,
    }
  );
}
