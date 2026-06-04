import { DataTypes } from "sequelize";
export function initCasasModel(sequelize) {
    return sequelize.define("Casa", {
        id_casa: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        morada: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        codigo_postal: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        data_criacao: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    }, {
        tableName: "casas",
        timestamps: false,
    });
}
