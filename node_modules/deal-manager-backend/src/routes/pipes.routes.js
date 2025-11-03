import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { 
  requirePermission, 
  applyOwnershipFilter, 
  requireOwnership, 
  ensureOwnerId,
  PERMISSIONS 
} from "../middleware/permissions.js";

const router = Router();

function parseDate(d) {
  if (!d) return new Date();
  return new Date(`${d}T12:00:00Z`);
}

/**
 * GET /api/pipes?semestre=2025-S1
 * Admin/Manager : voient tout
 * Business Developer : voit uniquement ses pipes (via applyOwnershipFilter)
 */
router.get("/", 
  authenticate,
  applyOwnershipFilter,
  async (req, res, next) => {
    try {
      const { semestre } = req.query;
      
      // Construire le filtre avec le semestre et le filtre de propriété
      const where = {
        ...req.ownershipFilter, // {} pour Admin/Manager, { ownerId: userId } pour BD
        ...(semestre ? { semestre: String(semestre) } : {})
      };
      
      const items = await prisma.pipe.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      
      res.json(items);
    } catch (e) { 
      next(e); 
    }
  }
);

/**
 * POST /api/pipes
 * Nécessite la permission CREATE_PIPE
 * Le middleware ensureOwnerId force l'ownerId pour les BD
 */
router.post("/", 
  authenticate,
  requirePermission(PERMISSIONS.CREATE_PIPE),
  ensureOwnerId,
  async (req, res, next) => {
    try {
      const b = req.body || {};
      
      const created = await prisma.pipe.create({
        data: {
          client: b.client ?? "",
          ic: b.ic ?? "",
          secteur: b.secteur ?? "",
          projets: b.projets ?? null,
          budget: Number(b.budget ?? 0),
          semestre: b.semestre ?? "",
          ownerId: b.ownerId, // Défini par ensureOwnerId
        },
      });
      
      res.status(201).json(created);
    } catch (e) { 
      next(e); 
    }
  }
);

/**
 * PUT /api/pipes/:id
 * Nécessite la permission EDIT_OWN_PIPE
 * Le middleware requireOwnership vérifie la propriété pour les BD
 */
router.put("/:id", 
  authenticate,
  requirePermission(PERMISSIONS.EDIT_OWN_PIPE),
  requireOwnership('pipe'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const b = req.body || {};
      
      const updated = await prisma.pipe.update({
        where: { id },
        data: {
          client: b.client,
          ic: b.ic,
          secteur: b.secteur,
          projets: b.projets,
          budget: b.budget !== undefined ? Number(b.budget) : undefined,
          semestre: b.semestre,
        },
      });
      
      res.json(updated);
    } catch (e) { 
      next(e); 
    }
  }
);

/**
 * DELETE /api/pipes/:id
 * Nécessite la permission DELETE_OWN_PIPE
 * Le middleware requireOwnership vérifie la propriété pour les BD
 */
router.delete("/:id", 
  authenticate,
  requirePermission(PERMISSIONS.DELETE_OWN_PIPE),
  requireOwnership('pipe'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.pipe.delete({ where: { id } });
      res.status(204).end();
    } catch (e) { 
      next(e); lot
    }
  }
);

export default router;
