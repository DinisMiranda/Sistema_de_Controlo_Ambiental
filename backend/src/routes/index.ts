import { Router } from "express";
import { sensoresRouter } from "./sensores.routes.js";
import { atuadoresRouter } from "./atuadores.routes.js";
import { authRouter } from "./auth.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/sensores", sensoresRouter);
apiRouter.use("/atuadores", atuadoresRouter);
