import { Router } from "express";
import { sensoresRouter } from "./sensores.routes.js";
import { atuadoresRouter } from "./atuadores.routes.js";
import { authRouter } from "./auth.routes.js";
import { tiposRouter } from "./tipos.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/tipos", tiposRouter);
apiRouter.use("/sensores", sensoresRouter);
apiRouter.use("/atuadores", atuadoresRouter);
