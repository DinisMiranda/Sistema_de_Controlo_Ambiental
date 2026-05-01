import { DataTypes, Sequelize } from "sequelize";

export function initAcoesSistemaModel(sequelize: Sequelize) {
  return sequelize.define(
    "AcaoSistema",
    {
      id_acao: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      id_atuador: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo_acao: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      valor_aplicado: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      motivo: {
        type: DataTypes.TEXT,
      },
      timestamp_acao: {
        type: DataTypes.DATE,
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
      tableName: "acoes_sistema",
      timestamps: false,
    }
  );
}
