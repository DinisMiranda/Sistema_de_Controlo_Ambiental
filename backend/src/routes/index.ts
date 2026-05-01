import { Router } from "express";
import { sensoresRouter } from "./sensores.routes.js";
import { atuadoresRouter } from "./atuadores.routes.js";

export const apiRouter = Router();

apiRouter.use("/sensores", sensoresRouter);
apiRouter.use("/atuadores", atuadoresRouter);
