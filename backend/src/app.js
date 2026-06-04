import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { requestLogger } from "./middlewares/request-logger.js";
import { errorHandler, notFoundHandler, } from "./middlewares/error.middleware.js";
import { reportsRouter } from "./routes/reports.routes.js";
export const app = express();
app.use(cors());
app.use(express.json());
app.use("/reports", reportsRouter);
app.use(requestLogger);
app.get("/", (_req, res) => {
    res.json({
        status: "ok",
        message: "SCA Backend API",
    });
});
app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
