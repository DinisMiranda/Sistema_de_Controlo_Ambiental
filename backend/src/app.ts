import express from "express";
import cors from "cors";
import { db } from "./lib/db.js";
import { apiRouter } from "./routes/index.js";
import { requestLogger } from "./middlewares/request-logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health/db", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
