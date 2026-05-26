import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const reportsRouter = Router();

// fake in-memory reports
let reports = [
  {
    id: 1,
    type: "consumption",
    value: 0,
    room: "Sala Principal",
    updatedAt: new Date(),
  },
];

// simulate changing sensor values every 3 seconds
setInterval(() => {
  reports[0].value = Math.floor(Math.random() * 100);
  reports[0].updatedAt = new Date();

  console.log("Updated value:", reports[0].value);
}, 3000);

reportsRouter.get("/", requireAuth, async (_req, res) => {
  try {
    res.json(reports);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao obter relatórios",
    });
  }
});