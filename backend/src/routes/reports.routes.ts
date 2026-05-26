import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { models } from "../models/sequelize/index.js";

export const reportsRouter = Router();

reportsRouter.get("/", requireAuth, async (_req, res) => {
  try {
    const registos = await models.RegistoConsumo.findAll({
      include: [
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
      ],
      order: [["periodo_fim", "DESC"]],
      limit: 100,
    });

    const reports = registos.map((registo) => {
      const leitura = registo.get("LeituraSensor") as {
        get: (key: string) => unknown;
        Sensor?: { get: (key: string) => unknown };
      } | null;
      const sensor = leitura?.Sensor;
      const room = sensor ? String(sensor.get("localizacao")) : "—";

      return {
        id: registo.get("id_registo"),
        type: "consumo",
        consumo: registo.get("consumo"),
        unidade: registo.get("unidade"),
        value: registo.get("consumo"),
        room,
        department: room,
        nome: room,
        periodo_inicio: registo.get("periodo_inicio"),
        periodo_fim: registo.get("periodo_fim"),
        updatedAt: registo.get("periodo_fim"),
      };
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao obter relatórios" });
  }
});
