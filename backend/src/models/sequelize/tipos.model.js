import { DataTypes } from "sequelize";
export function initTiposModel(sequelize) {
    return sequelize.define("Tipo", {
        classe: {
            type: DataTypes.STRING(100),
            allowNull: false,
            primaryKey: true,
        },
        tipo: {
            type: DataTypes.STRING(150),
            allowNull: false,
            primaryKey: true,
        },
        descricao: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "descrição",
        },
    }, {
        tableName: "Tipos",
        timestamps: false,
    });
}
