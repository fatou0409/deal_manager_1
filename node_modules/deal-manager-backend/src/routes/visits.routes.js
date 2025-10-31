// backend/src/routes/visits.routes.js
import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { ROLES } from "../middleware/permissions.js";

const router = Router();

function parseDate(d) {
  if (!d) return new Date();
  return new Date(`${d}T12:00:00Z`);
}

/**
 * GET /api/visits?semestre=2025-S1
 * Accessible par : ADMIN, MANAGER, BD (chacun voit ses propres visites), GUEST (lecture)
 * ✅ MODIFIÉ : Inclut maintenant les informations du créateur (user)
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { semestre } = req.query;
    const { role, id: userId } = req.user;
    
    // Construire le filtre selon le rôle
    let where = semestre ? { semestre: String(semestre) } : {};
    
    // BUSINESS_DEVELOPER voit uniquement ses visites (filtre par userId)
    if (role === ROLES.BUSINESS_DEVELOPER) {
      where.userId = userId;
    }
    
    const items = await prisma.visit.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { date: "desc" },
    });
    
    res.json(items);
  } catch (e) { 
    next(e); 
  }
});

/**
 * POST /api/visits
 * Accessible par : ADMIN, MANAGER, BD
 * ✅ MODIFIÉ : Retourne maintenant les informations du créateur après création
 */
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    
    if (![ROLES.ADMIN, ROLES.MANAGER, ROLES.BUSINESS_DEVELOPER].includes(role)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    const b = req.body || {};
    const visitUserId = role === ROLES.BUSINESS_DEVELOPER ? userId : (b.userId || userId);
    
    const created = await prisma.visit.create({
      data: {
        date:          b.date ? parseDate(b.date) : new Date(), // ✅ Correction
        type:          b.type ?? "",
        semestre:      b.semestre ?? "",
        client:        b.client ?? "",
        secteur:       b.secteur ?? "",
        sujet:         b.sujet ?? "",
        accompagnants: b.accompagnants ?? null,
        userId:        visitUserId,
      },
      include: {
        user: {
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
 * PUT /api/visits/:id
 * Accessible par : ADMIN, MANAGER, BD (seulement leurs propres visites)
 * ✅ MODIFIÉ : Retourne les informations du créateur après modification
 */
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    
    if (![ROLES.ADMIN, ROLES.MANAGER, ROLES.BUSINESS_DEVELOPER].includes(role)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    if (role === ROLES.BUSINESS_DEVELOPER) {
      const visit = await prisma.visit.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (!visit) {
        return res.status(404).json({ message: "Visite non trouvée" });
      }
      
      if (visit.userId !== userId) {
        return res.status(403).json({ 
          message: "Accès refusé : vous ne pouvez modifier que vos propres visites" 
        });
      }
    }
    
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
      include: {
        user: {
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
 * DELETE /api/visits/:id
 * Accessible par : ADMIN, MANAGER, BD (seulement leurs propres visites)
 */
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    
    if (![ROLES.ADMIN, ROLES.MANAGER, ROLES.BUSINESS_DEVELOPER].includes(role)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    if (role === ROLES.BUSINESS_DEVELOPER) {
      const visit = await prisma.visit.findUnique({
        where: { id },
        select: { userId: true }
      });
      
      if (!visit) {
        return res.status(404).json({ message: "Visite non trouvée" });
      }
      
      if (visit.userId !== userId) {
        return res.status(403).json({ 
          message: "Accès refusé : vous ne pouvez supprimer que vos propres visites" 
        });
      }
    }
    
    await prisma.visit.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { 
    next(e); 
  }
});

export default router;