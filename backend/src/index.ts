import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./lib/db.js";
import { sensoresRouter } from "./routes/sensores.js";
import { atuadoresRouter } from "./routes/atuadores.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// DB check (opcional; falha se a BD não estiver acessível)
app.get("/health/db", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

// API routes
app.use("/api/sensores", sensoresRouter);
app.use("/api/atuadores", atuadoresRouter);

app.listen(PORT, () => {
  console.log(`SCA API listening on http://localhost:${PORT}`);
});
