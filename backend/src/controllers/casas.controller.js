import { models } from "../models/sequelize/index.js";
import { roomKeyFromLocation } from "../utils/room.js";
function mapCasaForAdmin(casa) {
    return {
        id: casa.get("id_casa"),
        name: casa.get("nome"),
        location: casa.get("morada"),
        type: casa.get("codigo_postal"),
    };
}
/** Salas derivadas das localizações dos sensores (compatível com departamento/dashboard). */
export async function getSalasFromSensores(_req, res) {
    const sensores = await models.Sensor.findAll({
        attributes: ["localizacao"],
        group: ["localizacao"],
        order: [["localizacao", "ASC"]],
    });
    const salas = sensores.map((sensor) => {
        const localizacao = String(sensor.get("localizacao"));
        return {
            id: roomKeyFromLocation(localizacao),
            name: localizacao,
            location: localizacao,
            badge: "Ativo",
            type: "Ativo",
        };
    });
    res.json(salas);
}
export async function getSalaByKey(req, res) {
    const key = req.params.id;
    const sensores = await models.Sensor.findAll({
        order: [["localizacao", "ASC"]],
    });
    const match = sensores.find((s) => roomKeyFromLocation(String(s.get("localizacao"))) === key);
    if (!match) {
        return res.status(404).json({ error: "Sala não encontrada." });
    }
    const localizacao = String(match.get("localizacao"));
    res.json({
        id: key,
        name: localizacao,
        location: localizacao,
        badge: "Ativo",
        type: "Ativo",
    });
}
export async function listCasas(_req, res) {
    const rows = await models.Casa.findAll({ order: [["id_casa", "ASC"]] });
    res.json(rows.map(mapCasaForAdmin));
}
export async function getCasaById(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    const casa = await models.Casa.findByPk(id);
    if (!casa) {
        return res.status(404).json({ error: "Casa não encontrada" });
    }
    res.json(mapCasaForAdmin(casa));
}
export async function createCasa(req, res) {
    const { nome, morada, codigo_postal } = req.body;
    if (!nome || !morada || !codigo_postal) {
        return res.status(400).json({ error: "nome, morada e codigo_postal são obrigatórios" });
    }
    const created = await models.Casa.create({
        nome,
        morada,
        codigo_postal,
        data_criacao: new Date(),
    });
    res.status(201).json(mapCasaForAdmin(created));
}
export async function updateCasa(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    const casa = await models.Casa.findByPk(id);
    if (!casa) {
        return res.status(404).json({ error: "Casa não encontrada" });
    }
    const { name, location, type, nome, morada, codigo_postal } = req.body;
    await casa.update({
        nome: nome ?? name ?? casa.get("nome"),
        morada: morada ?? location ?? casa.get("morada"),
        codigo_postal: codigo_postal ?? type ?? casa.get("codigo_postal"),
    });
    res.json(mapCasaForAdmin(casa));
}
export async function deleteCasa(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    const deleted = await models.Casa.destroy({ where: { id_casa: id } });
    if (!deleted) {
        return res.status(404).json({ error: "Casa não encontrada" });
    }
    res.status(204).send();
}
export async function listDepartments(_req, res) {
    const casas = await models.Casa.findAll({
        attributes: ["id_casa", "nome"],
        order: [["nome", "ASC"]],
    });
    res.json(casas.map((c) => ({
        id: c.get("id_casa"),
        name: c.get("nome"),
    })));
}
