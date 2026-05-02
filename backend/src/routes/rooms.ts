import { Router, type Request, type Response } from "express";

export const roomsRouter = Router();

const rooms = {
  "sala-101": {
    id: "sala-101",
    name: "Sala 101",
    badge: "Ativo",
    temperature: 22.5,
    humidity: 45,
    lightingOn: 30,
    lightingTotal: 42,
    status: "normal",
    statusText: "Ambiente Normal",
    lastUpdate: "há 2 minutos",
    location: "1º Andar, Ala Norte",
    capacity: "25 pessoas",
    area: "45 m²",
    hvacSystem: "Daikin VRV Plus",
    lastMaintenance: "15/03/2026",
    nextMaintenance: "15/06/2026",
    alerts: [
      {
        type: "normal",
        title: "Temperatura Estável",
        message: "A temperatura está dentro dos parâmetros ideais (20-24°C)",
        time: "há 5 minutos",
      },
      {
        type: "normal",
        title: "Umidade Controlada",
        message: "A umidade está dentro dos parâmetros ideais (40-60%)",
        time: "há 10 minutos",
      },
    ],
  },
  "sala-102": {
    id: "sala-102",
    name: "Sala 102",
    badge: "Ativo",
    temperature: 23.1,
    humidity: 42,
    lightingOn: 25,
    lightingTotal: 38,
    status: "normal",
    statusText: "Ambiente Normal",
    lastUpdate: "há 1 minuto",
    location: "1º Andar, Ala Norte",
    capacity: "20 pessoas",
    area: "38 m²",
    hvacSystem: "Carrier AquaEdge",
    lastMaintenance: "10/03/2026",
    nextMaintenance: "10/06/2026",
    alerts: [
      {
        type: "normal",
        title: "Sistemas Operacionais",
        message: "Todos os sistemas funcionando corretamente",
        time: "há 3 minutos",
      },
    ],
  },
  "sala-201": {
    id: "sala-201",
    name: "Sala 201",
    badge: "Ativo",
    temperature: 21.8,
    humidity: 48,
    lightingOn: 18,
    lightingTotal: 28,
    status: "normal",
    statusText: "Ambiente Normal",
    lastUpdate: "há 3 minutos",
    location: "2º Andar, Ala Sul",
    capacity: "18 pessoas",
    area: "32 m²",
    hvacSystem: "Mitsubishi Electric",
    lastMaintenance: "20/03/2026",
    nextMaintenance: "20/06/2026",
    alerts: [
      {
        type: "normal",
        title: "Qualidade do Ar Excelente",
        message: "Níveis de CO₂ em 380 ppm, abaixo do limite recomendado",
        time: "há 7 minutos",
      },
    ],
  },
  auditorio: {
    id: "auditorio",
    name: "Auditório Principal",
    badge: "Em Uso",
    temperature: 26.5,
    humidity: 38,
    lightingOn: 42,
    lightingTotal: 42,
    status: "alert",
    statusText: "Temperatura Elevada",
    lastUpdate: "há 1 minuto",
    location: "Térreo, Área Central",
    capacity: "150 pessoas",
    area: "180 m²",
    hvacSystem: "Trane IntelliPak",
    lastMaintenance: "01/04/2026",
    nextMaintenance: "01/07/2026",
    alerts: [
      {
        type: "critical",
        title: "Temperatura Acima do Ideal",
        message:
          "A temperatura está em 26.5°C, acima do limite recomendado de 24°C",
        time: "há 1 minuto",
      },
      {
        type: "warning",
        title: "Umidade Baixa",
        message: "A umidade está em 38%, abaixo do limite ideal de 40%",
        time: "há 5 minutos",
      },
      {
        type: "warning",
        title: "Evento em Andamento",
        message: "Auditório com capacidade de 80% ocupada",
        time: "há 15 minutos",
      },
    ],
  },
  laboratorio: {
    id: "laboratorio",
    name: "Laboratório A",
    badge: "Ativo",
    temperature: 20.2,
    humidity: 52,
    lightingOn: 28,
    lightingTotal: 28,
    status: "attention",
    statusText: "Umidade Elevada",
    lastUpdate: "há 5 minutos",
    location: "3º Andar, Ala Leste",
    capacity: "30 pessoas",
    area: "65 m²",
    hvacSystem: "York YK Centrifugal",
    lastMaintenance: "05/04/2026",
    nextMaintenance: "05/07/2026",
    alerts: [
      {
        type: "warning",
        title: "Umidade Acima do Ideal",
        message:
          "A umidade está em 52%, ligeiramente acima dos 50% recomendados",
        time: "há 5 minutos",
      },
      {
        type: "normal",
        title: "Iluminação Total Ativada",
        message:
          "Todas as 28 lâmpadas estão acesas conforme protocolo do laboratório",
        time: "há 30 minutos",
      },
    ],
  },
};

type RoomValue = (typeof rooms)[keyof typeof rooms];

roomsRouter.get("/", (_req: Request, res: Response) => {
  res.json(Object.values(rooms));
});

roomsRouter.get("/:id", (req: Request, res: Response) => {
  const roomId = req.params.id;
  const room = (rooms as Record<string, RoomValue>)[roomId];

  if (!room) {
    return res.status(404).json({ error: "Sala não encontrada." });
  }

  return res.json(room);
});
