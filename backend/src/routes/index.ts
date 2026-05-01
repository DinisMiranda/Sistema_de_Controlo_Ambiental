import { Router } from "express";
import { sensoresRouter } from "./sensores.routes.js";
import { atuadoresRouter } from "./atuadores.routes.js";
import { authRouter } from "./auth.routes.js";
import { tiposRouter } from "./tipos.routes.js";
import { leiturasRouter } from "./leituras.routes.js";
import { acoesRouter } from "./acoes.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/tipos", tiposRouter);
apiRouter.use("/sensores", sensoresRouter);
apiRouter.use("/atuadores", atuadoresRouter);
apiRouter.use("/sensors", leiturasRouter);
apiRouter.use("/actuators", acoesRouter);
