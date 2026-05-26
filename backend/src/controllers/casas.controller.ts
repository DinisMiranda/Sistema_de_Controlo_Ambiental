import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";
import { roomKeyFromLocation } from "../utils/room.js";

function mapCasaForAdmin(casa: { get: (key: string) => unknown }) {
  return {
    id: casa.get("id_casa"),
    name: casa.get("nome"),
    location: casa.get("morada"),
    type: casa.get("codigo_postal"),
  };
}

/** Salas derivadas das localizações dos sensores (compatível com departamento/dashboard). */
