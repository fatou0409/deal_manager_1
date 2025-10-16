// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

import dealsRouter from "./routes/deals.routes.js";
import visitsRouter from "./routes/visits.routes.js";
import objectivesRouter from "./routes/objectives.routes.js";
import authRouter from "./routes/auth.routes.js";
import usersRouter from "./routes/users.routes.js";
import statsRouter from "./routes/stats.routes.js";
import pipeRouter from "./routes/pipe.routes.js"; // ✅ Import des routes pipe

export const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Désactive le cache ETag
app.set("etag", false);

// Route de santé
app.get("/health", (_req, res) => res.json({ ok: true }));

// ✅ Routes principales (sans préfixe /api)
// Le proxy Vite enlève déjà le /api, donc les requêtes arrivent directement ici
app.use("/auth", authRouter);
app.use("/deals", dealsRouter);
app.use("/visits", visitsRouter);
app.use("/objectives", objectivesRouter);
app.use("/stats", statsRouter);
app.use("/users", usersRouter);
app.use("/pipe", pipeRouter); // ✅ Routes pipe ajoutées

// Gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({ 
    message: "Route non trouvée", 
    path: req.originalUrl 
  });
});

// Gestion globale des erreurs
app.use((err, _req, res, _next) => {
  console.error("Erreur serveur:", err);
  const status = err?.status || 500;
  res.status(status).json({ 
    message: err?.message || "Erreur serveur interne" 
  });
});