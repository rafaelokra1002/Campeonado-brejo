import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ name: "API Campeonato Brejolandense", status: "ok" }));
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Escudos enviados pelo admin (veja src/middleware/upload.js)
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads/crests")));

app.use("/api", routes);

app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada." }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`⚽ API do Campeonato Brejolandense rodando em http://localhost:${PORT}`);
});
