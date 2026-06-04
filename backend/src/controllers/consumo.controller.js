import { models } from "../models/sequelize/index.js";
function mapConsumoRow(registo) {
    const leitura = registo.LeituraSensor;
    const sensor = leitura?.Sensor;
    const room = sensor ? String(sensor.get("localizacao")) : "—";
    const consumo = Number(registo.get("consumo"));
    return {
        id: registo.get("id_registo"),
        type: "consumo",
        consumo,
        unidade: registo.get("unidade"),
        value: consumo,
        room,
        department: room,
        nome: room,
        periodo_inicio: registo.get("periodo_inicio"),
        periodo_fim: registo.get("periodo_fim"),
        updatedAt: registo.get("periodo_fim"),
    };
}
const consumoInclude = [
    {
        model: models.LeituraSensor,
        attributes: ["id_leitura", "id_sensor"],
        include: [
            {
                model: models.Sensor,
                attributes: ["localizacao"],
            },
        ],
    },
];
export async function getConsumoBySensor(req, res) {
    const idSensor = Number(req.params.id);
    if (Number.isNaN(idSensor)) {
        return res.status(400).json({ error: "ID inválido" });
    }
    const leituras = await models.LeituraSensor.findAll({
        where: { id_sensor: idSensor },
        attributes: ["id_leitura"],
    });
    const leituraIds = leituras.map((item) => Number(item.get("id_leitura")));
    if (leituraIds.length === 0) {
        return res.json([]);
    }
    const rows = await models.RegistoConsumo.findAll({
        where: { leituras_sensor_id_leitura: leituraIds },
        include: consumoInclude,
        order: [["periodo_inicio", "DESC"]],
    });
    res.json(rows.map(mapConsumoRow));
}
export async function getAllConsumo(_req, res) {
    const rows = await models.RegistoConsumo.findAll({
        include: consumoInclude,
        order: [["periodo_inicio", "DESC"]],
        limit: 100,
    });
    res.json(rows.map(mapConsumoRow));
}
