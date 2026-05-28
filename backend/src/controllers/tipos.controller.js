import { models } from "../models/sequelize/index.js";
export async function getAllTipos(_req, res) {
    const rows = await models.Tipo.findAll({
        order: [
            ["classe", "ASC"],
            ["tipo", "ASC"],
        ],
    });
    res.json(rows);
}
export async function getTipoById(req, res) {
    const { classe, tipo } = req.params;
    const row = await models.Tipo.findOne({ where: { classe, tipo } });
    if (!row) {
        return res.status(404).json({ error: "Tipo não encontrado" });
    }
    res.json(row);
}
export async function createTipo(req, res) {
    const { classe, tipo, descricao } = req.body;
    if (!classe || !tipo || !descricao) {
        return res
            .status(400)
            .json({ error: "classe, tipo e descricao são obrigatórios" });
    }
    const created = await models.Tipo.create({ classe, tipo, descricao });
    res.status(201).json(created);
}
export async function patchTipo(req, res) {
    const { classe, tipo } = req.params;
    const row = await models.Tipo.findOne({ where: { classe, tipo } });
    if (!row) {
        return res.status(404).json({ error: "Tipo não encontrado" });
    }
    await row.update(req.body);
    res.json(row);
}
export async function deleteTipo(req, res) {
    const { classe, tipo } = req.params;
    const deleted = await models.Tipo.destroy({ where: { classe, tipo } });
    if (!deleted) {
        return res.status(404).json({ error: "Tipo não encontrado" });
    }
    res.status(204).send();
}
