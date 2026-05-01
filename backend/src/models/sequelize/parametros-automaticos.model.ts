import { DataTypes, Sequelize } from "sequelize";

export function initParametrosAutomaticosModel(sequelize: Sequelize) {
  return sequelize.define(
    "ParametroAutomatico",
    {
      id_parametro: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      nome_parametro: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      valor_parametro: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      descricao: {
        type: DataTypes.TEXT,
      },
      data_atualizacao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      atuadores_id_atuador: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "parametros_automaticos",
      timestamps: false,
    }
  );
}
