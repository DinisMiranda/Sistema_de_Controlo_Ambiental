import 'dotenv/config'
import { Router } from "express";
import { sensoresRouter } from "./sensores.routes.js";
import { atuadoresRouter } from "./atuadores.routes.js";
import { authRouter } from "./auth.routes.js";
import { tiposRouter } from "./tipos.routes.js";
import { leiturasRouter } from "./leituras.routes.js";
import { acoesRouter } from "./acoes.routes.js";
import { consumoRouter } from "./consumo.routes.js";
import { parametrosRouter } from "./parametros.routes.js";
import { roomsRouter } from "./rooms.js";
import { casasRouter } from "./casas.routes.js";
import { departmentsRouter } from "./departments.routes.js";
import { reportsRouter } from './reports.routes.js';
import { usersRouter } from "./users.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/tipos", tiposRouter);
apiRouter.use("/sensores", sensoresRouter);
apiRouter.use("/atuadores", atuadoresRouter);
apiRouter.use("/sensors", leiturasRouter);
apiRouter.use("/actuators", acoesRouter);
apiRouter.use("/consumo", consumoRouter);
apiRouter.use("/consumption", consumoRouter);
apiRouter.use("/automatic-parameters", parametrosRouter);
apiRouter.use("/salas", roomsRouter);
apiRouter.use("/casas", casasRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/users", usersRouter);
