// backend/src/routes/pipe.routes.js
import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();

function parseDate(d) {
  if (!d) return new Date();
  return new Date(`${d}T12:00:00Z`);
}

/**
 * GET /api/pipe
 * Liste toutes les opportunités pipe
 * Query params: ?semestre=2025-S1
 */
router.get("/", async (req, res, next) => {
  try {
    const { semestre } = req.query;
    const where = {};
    
    if (semestre) {
      where.semestre = String(semestre);
    }

    // ✅ Utilise prisma.pipe (pas prisma.deal)
    const items = await prisma.pipe.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    res.json(items);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/pipe/:id
 * Récupère un pipe spécifique
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // ✅ Utilise prisma.pipe (pas prisma.deal)
    const item = await prisma.pipe.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({ message: "Pipe non trouvé" });
    }

    res.json(item);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/pipe
 * Crée une nouvelle opportunité pipe
 * 
 * Champs attendus:
 * - client (requis)
 * - secteur (requis)
 * - commercial (ic)
 * - projet (projets en vue)
 * - ca (budget estimatif)
 * - semestre
 * - dateCreation
 */
router.post("/", async (req, res, next) => {
  try {
    const b = req.body || {};

    // Validation des champs requis
    if (!b.client?.trim()) {
      return res.status(400).json({ message: "Le client est requis" });
    }

    if (!b.secteur?.trim()) {
      return res.status(400).json({ message: "Le secteur est requis" });
    }

    // ✅ Utilise prisma.pipe.create (pas prisma.deal.create)
    const created = await prisma.pipe.create({
      data: {
        client: b.client.trim(),
        commercial: b.commercial || null,
        secteur: b.secteur.trim(),
        projet: b.projet?.trim() || "(Projet à préciser)",
        ca: Number(b.ca || 0),
        statut: b.statut || "Open",
        semestre: b.semestre || "",
        dateCreation: parseDate(b.dateCreation),
        userId: b.userId || null,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error("Erreur création pipe:", e);
    next(e);
  }
});

/**
 * PUT /api/pipe/:id
 * Met à jour une opportunité pipe
 */
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const b = req.body || {};

    // Vérifier que le pipe existe
    const existing = await prisma.pipe.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Pipe non trouvé" });
    }

    // ✅ Utilise prisma.pipe.update (pas prisma.deal.update)
    const updated = await prisma.pipe.update({
      where: { id },
      data: {
        client: b.client,
        commercial: b.commercial,
        secteur: b.secteur,
        projet: b.projet,
        ca: b.ca !== undefined ? Number(b.ca) : undefined,
        statut: b.statut,
        semestre: b.semestre,
        dateCreation: b.dateCreation ? parseDate(b.dateCreation) : undefined,
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/pipe/:id
 * Supprime une opportunité pipe
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le pipe existe
    const existing = await prisma.pipe.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Pipe non trouvé" });
    }

    // ✅ Utilise prisma.pipe.delete (pas prisma.deal.delete)
    await prisma.pipe.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;