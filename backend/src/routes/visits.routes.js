import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();

function parseDate(d) {
  if (!d) return new Date();
  return new Date(`${d}T12:00:00Z`);
}

// GET /api/visits?semestre=2025-S1
router.get("/", async (req, res, next) => {
  try {
    const { semestre } = req.query;
    const where = semestre ? { semestre: String(semestre) } : {};
    const items = await prisma.visit.findMany({
      where,
      orderBy: { date: "desc" },
    });
    res.json(items);
  } catch (e) { next(e); }
});

// POST /api/visits
router.post("/", async (req, res, next) => {
  try {
    const b = req.body || {};
    const created = await prisma.visit.create({
      data: {
        date:          parseDate(b.date),
        type:          b.type ?? "",
        semestre:      b.semestre ?? "",
        client:        b.client ?? "",
        secteur:       b.secteur ?? "",
        sujet:         b.sujet ?? "",
        accompagnants: b.accompagnants ?? null,
      },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// PUT /api/visits/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const b = req.body || {};
    const updated = await prisma.visit.update({
      where: { id },
      data: {
        date:          b.date ? parseDate(b.date) : undefined,
        type:          b.type,
        semestre:      b.semestre,
        client:        b.client,
        secteur:       b.secteur,
        sujet:         b.sujet,
        accompagnants: b.accompagnants,
      },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// DELETE /api/visits/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.visit.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
