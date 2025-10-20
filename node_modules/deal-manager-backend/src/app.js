// backend/src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

import dealsRouter from "./routes/deals.routes.js";
import visitsRouter from "./routes/visits.routes.js";
import objectivesRouter from "./routes/objectives.routes.js";
import authRouter from "./routes/auth.routes.js";
import usersRouter from "./routes/users.routes.js";
import statsRouter from "./routes/stats.routes.js";
import pipesRouter from "./routes/pipes.routes.js"; // ✅ Import des routes Pipe

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.set("etag", false);
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---- Préfixe /api (chemin canonique)
app.use("/api/auth", authRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/visits", visitsRouter);
app.use("/api/objectives", objectivesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/users", usersRouter);
app.use("/api/pipes", pipesRouter); // ✅ Route Pipe avec /api

// ---- Compat sans /api (puisque ton front appelle encore comme ça)
app.use("/auth", authRouter);
app.use("/deals", dealsRouter);
app.use("/visits", visitsRouter);
app.use("/objectives", objectivesRouter);
app.use("/stats", statsRouter);
app.use("/users", usersRouter);
app.use("/pipes", pipesRouter); // ✅ Route Pipe sans /api

app.use((req, res) => res.status(404).json({ message: "Not found", path: req.originalUrl }));
app.use((err, _req, res, _next) => {
  const status = err?.status || 500;
  res.status(status).json({ message: err?.message || "Server error" });
});