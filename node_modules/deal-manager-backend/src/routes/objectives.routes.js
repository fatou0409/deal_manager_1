// src/routes/objectives.routes.js
import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();

/**
 * GET /objectives?userId=&period=
 * Liste filtrée (ou tout si pas de filtres)
 */
router.get("/", async (req, res, next) => {
  try {
    const { userId, period } = req.query;
    const where = {};
    if (userId) where.userId = String(userId);
    if (period) where.period = String(period);

    const items = await prisma.objective.findMany({
      where,
      orderBy: [{ userId: "asc" }, { period: "desc" }],
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /objectives/:userId/:period
 * Récupère un objectif unique
 */
router.get("/:userId/:period", async (req, res, next) => {
  try {
    const { userId, period } = req.params;
    const item = await prisma.objective.findUnique({
      where: { userId_period: { userId, period } }, // clé composite exposée par Prisma
    });
    if (!item) return res.status(404).json({ message: "Objective not found" });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /objectives
 * Upsert par (userId, period) avec les 5 champs du front
 * Body attendu (à plat) : { userId, period, ca, marge, visites, one2one, workshops }
 */
router.put("/", async (req, res, next) => {
  try {
    const b = req.body || {};
    const userId = String(b.userId || "").trim();
    const period = String(b.period || "").trim();
    if (!userId || !period) {
      return res.status(400).json({ message: "userId et period sont requis" });
    }

    const data = {
      userId,
      period,
      ca: Number(b.ca ?? 0),
      marge: Number(b.marge ?? 0),
      visites: Number(b.visites ?? 0),
      one2one: Number(b.one2one ?? 0),
      workshops: Number(b.workshops ?? 0),
    };

    const saved = await prisma.objective.upsert({
      where: { userId_period: { userId, period } },
      create: data,
      update: data,
    });

    res.json(saved);
  } catch (e) {
    next(e);
  }
});

/**
 * ---- HISTORY (appelé par le front) ----
 * GET  /objectives/history/:userId/:period  -> renvoie aplatit
 * POST /objectives/history                   -> accepte à plat OU imbriqué dans 'values'
 *
 * Formats acceptés en POST :
 *  - { userId, period, by?, ca, marge, visites, one2one, workshops }
 *  - { userId, period, by?, values: { ca, marge, visites|visite, one2one, workshops|workshop } }
 */

// GET historique pour un user + période (réponse aplatie pour le front)
router.get("/history/:userId/:period", async (req, res, next) => {
  try {
    const { userId, period } = req.params;
    const rows = await prisma.objectiveHistory.findMany({
      where: { userId, period },
      orderBy: { ts: "desc" },
    });

    // On renvoie à plat pour coller à l'affichage du front
    const out = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      period: r.period,
      by: r.by,
      ts: r.ts,
      ca: Number(r.values?.ca ?? 0),
      marge: Number(r.values?.marge ?? 0),
      visites: Number(r.values?.visites ?? r.values?.visite ?? 0),
      one2one: Number(r.values?.one2one ?? 0),
      workshops: Number(r.values?.workshops ?? r.values?.workshop ?? 0),
    }));

    res.json(out);
  } catch (e) {
    next(e);
  }
});

// POST snapshot historique (accepte à plat OU sous 'values')
router.post("/history", async (req, res, next) => {
  try {
    const b = req.body || {};
    const userId = String(b.userId || "").trim();
    const period = String(b.period || "").trim();
    if (!userId || !period) {
      return res.status(400).json({ message: "userId et period sont requis" });
    }

    const values =
      b && typeof b.values === "object"
        ? {
            ca: Number(b.values.ca ?? 0),
            marge: Number(b.values.marge ?? 0),
            visites: Number(b.values.visites ?? b.values.visite ?? 0),
            one2one: Number(b.values.one2one ?? 0),
            workshops: Number(b.values.workshops ?? b.values.workshop ?? 0),
          }
        : {
            ca: Number(b.ca ?? 0),
            marge: Number(b.marge ?? 0),
            visites: Number(b.visites ?? 0),
            one2one: Number(b.one2one ?? 0),
            workshops: Number(b.workshops ?? 0),
          };

    const by = String(b.by || b.email || b.user || userId);

    const hist = await prisma.objectiveHistory.create({
      data: { userId, period, values, by },
    });

    // On peut renvoyer le snapshot créé brut, le GET l’aplatira de toute façon
    res.status(201).json(hist);
  } catch (e) {
    next(e);
  }
});

export default router;
