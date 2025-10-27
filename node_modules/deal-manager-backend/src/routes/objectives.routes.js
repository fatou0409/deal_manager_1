// backend/src/routes/objectives.routes.js
import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission, PERMISSIONS, ROLES } from "../middleware/permissions.js";

const router = Router();

/**
 * ---- HISTORY ----
 */

// GET /objectives/history/:userId/:period
router.get("/history/:userId/:period",
  authenticate,
  async (req, res, next) => {
    try {
      const { userId, period } = req.params;
      const { role, id: currentUserId } = req.user;
      
      // Business Developer ne peut voir que son propre historique
      if (role === ROLES.BUSINESS_DEVELOPER && userId !== currentUserId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
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
    } catch (e) { 
      next(e); 
    }
  }
);

// 🔴 POST /objectives/history - SEUL MANAGER/ADMIN
router.post("/history",
  authenticate,
  requirePermission(PERMISSIONS.SET_OBJECTIVES),
  async (req, res, next) => {
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

      const by = String(b.by || req.user.email || req.user.id);

      const hist = await prisma.objectiveHistory.create({
        data: { userId, period, values, by },
      });

      res.status(201).json(hist);
    } catch (e) { 
      next(e); 
    }
  }
);

// 🔴 DELETE /objectives/history/:id - SEUL MANAGER/ADMIN
router.delete("/history/:id",
  authenticate,
  requirePermission(PERMISSIONS.SET_OBJECTIVES),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.objectiveHistory.delete({ 
        where: { id } 
      });
      res.status(204).end();
    } catch (e) { 
      next(e); 
    }
  }
);

/**
 * ---- OBJECTIVES CRUD ----
 */

// 🔴 GET /objectives?userId=&period=
router.get("/",
  authenticate,
  async (req, res, next) => {
    try {
      const { userId, period } = req.query;
      const { role, id: currentUserId } = req.user;
      
      const where = {};
      
      // Business Developer ne peut voir que ses propres objectifs
      if (role === ROLES.BUSINESS_DEVELOPER) {
        where.userId = currentUserId;
      } else if (userId) {
        // Admin/Manager peuvent filtrer par userId
        where.userId = String(userId);
      }
      
      if (period) {
        where.period = String(period);
      }

      const items = await prisma.objective.findMany({
        where,
        orderBy: [{ userId: "asc" }, { period: "desc" }],
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });
      
      res.json(items);
    } catch (e) { 
      next(e); 
    }
  }
);

// 🔴 GET /objectives/:userId/:period
router.get("/:userId/:period",
  authenticate,
  async (req, res, next) => {
    try {
      const { userId, period } = req.params;
      const { role, id: currentUserId } = req.user;
      
      // Business Developer ne peut voir que ses propres objectifs
      if (role === ROLES.BUSINESS_DEVELOPER && userId !== currentUserId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      const item = await prisma.objective.findUnique({
        where: { userId_period: { userId, period } },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });
      
      if (!item) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json(item);
    } catch (e) { 
      next(e); 
    }
  }
);

// 🔴 PUT /objectives - SEUL MANAGER/ADMIN PEUT DÉFINIR
router.put("/",
  authenticate,
  requirePermission(PERMISSIONS.SET_OBJECTIVES),
  async (req, res, next) => {
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
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.json(saved);
    } catch (e) { 
      next(e); 
    }
  }
);

export default router;