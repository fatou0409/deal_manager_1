// src/routes/stats.routes.js
import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();

// GET /api/stats/pipe
router.get("/pipe", async (_req, res, next) => {
  try {
    const deals = await prisma.deal.findMany({ orderBy: { updatedAt: "desc" } });

    const byClient = new Map();
    for (const d of deals) {
      const key = d.client || "—";
      if (!byClient.has(key)) {
        byClient.set(key, {
          client: key,
          ic: "",           // tu peux afficher le commercial si tu veux
          secteur: d.secteur || "",
          projets: 0,
          budget: 0,
        });
      }
      const row = byClient.get(key);

      const s = (d.statut || "").toLowerCase();
      const isWon = s === "gagné" || s === "gagne" || s === "won";
      if (!isWon) row.projets += 1;       // “Projets en vue” = non gagnés
      row.budget += Number(d.ca || 0);    // “Budget estimatif” = somme CA

      if (d.secteur) row.secteur = d.secteur;
      if (d.commercial) row.ic = d.commercial;
    }

    res.json(Array.from(byClient.values()));
  } catch (e) { next(e); }
});

export default router;
