import { models } from "../models/sequelize/index.js";
export async function getAllAtuadores(_req, res) {
    const atuadores = await models.Atuador.findAll({ order: [["id_atuador", "ASC"]] });
    res.json(atuadores);
}
export async function getAtuadorById(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    const atuador = await models.Atuador.findByPk(id);
    if (!atuador) {
        return res.status(404).json({ error: "Atuador não encontrado" });
    }
    res.json(atuador);
}
export async function createAtuador(req, res) {
    try {
        const { nome, tipo_atuador, localizacao, estado, Tipos_classe, Tipos_tipo } = req.body;
        if (!nome || !tipo_atuador || !localizacao) {
            return res.status(400).json({
                error: "Campos obrigatórios em falta",
            });
        }
        const atuador = await models.Atuador.create({
            nome,
            tipo_atuador,
            localizacao,
            estado: estado ?? "ativo",
            Tipos_classe: Tipos_classe ?? "Atuador",
            Tipos_tipo: Tipos_tipo ?? tipo_atuador,
        });
        return res.status(201).json(atuador);
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({
            error: err.message,
        });
    }
}
export async function patchAtuador(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    const atuador = await models.Atuador.findByPk(id);
    if (!atuador) {
        return res.status(404).json({ error: "Atuador não encontrado" });
    }
    await atuador.update(req.body);
    res.json(atuador);
}
export async function deleteAtuador(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    const deleted = await models.Atuador.destroy({ where: { id_atuador: id } });
    if (!deleted) {
        return res.status(404).json({ error: "Atuador não encontrado" });
    }
    res.status(204).send();
}
