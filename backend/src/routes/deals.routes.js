// src/routes/deals.routes.js
import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();

function parseDate(d) {
  if (!d) return new Date();
  // "YYYY-MM-DD" => milieu de journée UTC pour éviter décalages
  return new Date(`${d}T12:00:00Z`);
}

// GET /api/deals
router.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.deal.findMany({ orderBy: { updatedAt: "desc" } });
    res.json(items);
  } catch (e) { next(e); }
});

// POST /api/deals
router.post("/", async (req, res, next) => {
  try {
    const b = req.body || {};
    const s = (b.statut || "").toString().toLowerCase();
    const isGagne = s === "gagné" || s === "gagne" || s === "won";

    const created = await prisma.deal.create({
      data: {
        projet:       b.projet ?? "",
        client:       b.client ?? "",
        secteur:      b.secteur ?? "",
        dateCreation: parseDate(b.dateCreation),
        typeDeal:     b.typeDeal ?? null,
        commercial:   b.commercial ?? null,
        supportAV:    b.supportAV ?? null,
        semestre:     b.semestre ?? "",
        ca:           isGagne ? Number(b.ca ?? 0) : 0,
        marge:        isGagne ? Number(b.marge ?? 0) : 0,
        statut:       b.statut ?? "",
      },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// PUT /api/deals/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const b = req.body || {};
    const s = (b.statut ?? "").toString().toLowerCase();
    const isGagne = s === "gagné" || s === "gagne" || s === "won";

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        projet:       b.projet,
        client:       b.client,
        secteur:      b.secteur,
        dateCreation: b.dateCreation ? parseDate(b.dateCreation) : undefined,
        typeDeal:     b.typeDeal,
        commercial:   b.commercial,
        supportAV:    b.supportAV,
        semestre:     b.semestre,
        ca:           isGagne ? Number(b.ca ?? 0) : 0,
        marge:        isGagne ? Number(b.marge ?? 0) : 0,
        statut:       b.statut,
      },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// DELETE /api/deals/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.deal.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
