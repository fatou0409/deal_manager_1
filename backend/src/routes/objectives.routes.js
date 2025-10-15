import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();

/**
 * ---- HISTORY (PLACÉ EN PREMIER POUR NE PAS ÊTRE PRIS PAR /:userId/:period) ----
 */

// GET  /objectives/history/:userId/:period  -> renvoie aplati
router.get("/history/:userId/:period", async (req, res, next) => {
  try {
    const { userId, period } = req.params;
    const rows = await prisma.objectiveHistory.findMany({
      where: { userId, period },
      orderBy: { ts: "desc" },
    });
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
  } catch (e) { next(e); }
});

// POST /objectives/history
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

    res.status(201).json(hist);
  } catch (e) { next(e); }
});

/**
 * ---- OBJECTIVES CRUD ----
 */

// GET /objectives?userId=&period=
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
  } catch (e) { next(e); }
});

// GET /objectives/:userId/:period
router.get("/:userId/:period", async (req, res, next) => {
  try {
    const { userId, period } = req.params;
    const item = await prisma.objective.findUnique({
      where: { userId_period: { userId, period } },
    });
    if (!item) return res.status(404).json({ message: "Objective not found" });
    res.json(item);
  } catch (e) { next(e); }
});

// PUT /objectives
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
  } catch (e) { next(e); }
});

export default router;
