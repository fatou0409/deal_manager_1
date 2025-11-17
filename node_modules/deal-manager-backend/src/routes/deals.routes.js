// backend/src/routes/deals.routes.js
import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import {
  applyOwnershipFilter,
  ensureOwnerId,
  PERMISSIONS,
  requireOwnership,
  requirePermission,
} from "../middleware/permissions.js";

const router = Router();

function parseDate(d) {
  if (!d) return new Date();
  return new Date(`${d}T12:00:00Z`);
}

/**
 * GET /api/deals?semestre=2025-S1
 * Accessible par : ADMIN, MANAGER, BD (chacun voit ses propres deals), GUEST (lecture)
 * ✅ MODIFIÉ : Inclut maintenant les informations du créateur (owner)
 */
router.get("/", authenticate, applyOwnershipFilter, async (req, res, next) => {
  try {
    const { semestre } = req.query;
    const where = {
      ...req.ownershipFilter, // Applique le filtre du middleware
      ...(semestre && { semestre: String(semestre) }),
    };
    
    const items = await prisma.deal.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    });
    
    res.json(items);
  } catch (e) { 
    next(e); 
  }
});

/**
 * POST /api/deals
 * Accessible par : ADMIN, MANAGER, BD
 * ✅ MODIFIÉ : Retourne maintenant les informations du créateur après création
 */
router.post("/", authenticate, requirePermission(PERMISSIONS.CREATE_DEAL), ensureOwnerId, async (req, res, next) => {
  try {
    const { errors, clean } = validate(req.body || {}, {
      projet: { type: 'string', required: true, minLength: 1 },
      client: { type: 'string', required: true, minLength: 1 },
      secteur: { type: 'string', required: true },
      semestre: { type: 'string', required: true },
      statut: { type: 'string', required: true },
      dateCreation: { type: 'string' },
      typeDeal: { type: 'string' },
      commercial: { type: 'string' },
      supportAV: { type: 'string' },
      ca: { type: 'float' },
      marge: { type: 'float' }
    });

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Paramètres invalides', errors });
    }

    // ownerId est injecté par ensureOwnerId
    const ownerId = req.body.ownerId;
    if (!ownerId) {
      return res.status(400).json({ message: "ownerId est manquant et n'a pas été défini par le middleware." });
    }

    const created = await prisma.deal.create({
      data: {
        projet:       clean.projet,
        client:       clean.client,
        secteur:      clean.secteur,
        dateCreation: clean.dateCreation ? parseDate(clean.dateCreation) : new Date(),
        typeDeal:     clean.typeDeal ?? null,
        commercial:   clean.commercial ?? null,
        supportAV:    clean.supportAV ?? null,
        semestre:     clean.semestre,
  ca:           clean.ca === undefined ? 0 : Number(clean.ca),
  marge:        clean.marge === undefined ? 0 : Number(clean.marge),
        statut:       clean.statut,
        ownerId:      ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(created);
  } catch (e) { 
    next(e); 
  }
});

/**
 * PUT /api/deals/:id
 * Accessible par : ADMIN, MANAGER, BD (seulement leurs propres deals)
 * ✅ MODIFIÉ : Retourne les informations du créateur après modification
 */
router.put("/:id", authenticate, requirePermission(PERMISSIONS.EDIT_OWN_DEAL), requireOwnership('deal'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const b = req.body || {};

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
        ca:           Number(b.ca ?? 0), // ✅ Correction
        marge:        Number(b.marge ?? 0), // ✅ Correction
        statut:       b.statut,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    res.json(updated);
  } catch (e) { 
    next(e); 
  }
});

/**
 * DELETE /api/deals/:id
 * Accessible par : ADMIN, MANAGER, BD (seulement leurs propres deals)
 */
router.delete("/:id", authenticate, requirePermission(PERMISSIONS.DELETE_OWN_DEAL), requireOwnership('deal'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.deal.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { 
    next(e); 
  }
});

export default router;