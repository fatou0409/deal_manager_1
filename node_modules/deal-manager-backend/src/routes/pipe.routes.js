// backend/src/routes/pipes.routes.js
import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();

// GET /api/pipes?semestre=2025-S1
router.get("/", async (req, res, next) => {
  try {
    const { semestre } = req.query;
    const where = semestre ? { semestre: String(semestre) } : {};
    
    const items = await prisma.pipe.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
    
    res.json(items);
  } catch (e) { 
    console.error('Erreur GET pipes:', e.message);
    next(e); 
  }
});

// POST /api/pipes
router.post("/", async (req, res, next) => {
  try {
    const b = req.body || {};
    
    // Validation des champs requis
    if (!b.client || !b.client.trim()) {
      return res.status(400).json({ message: "Le client est requis" });
    }
    if (!b.ic || !b.ic.trim()) {
      return res.status(400).json({ message: "L'IC est requis" });
    }
    if (!b.secteur || !b.secteur.trim()) {
      return res.status(400).json({ message: "Le secteur est requis" });
    }

    const dataToCreate = {
      client: b.client.trim(),
      ic: b.ic.trim(),
      secteur: b.secteur.trim(),
      projets: b.projets?.trim() || null,
      budget: Number(b.budget || 0),
      semestre: b.semestre || "",
    };

    // Si un ID est fourni, on l'utilise
    if (b.id && typeof b.id === 'string' && b.id.trim()) {
      dataToCreate.id = b.id.trim();
    }

    const created = await prisma.pipe.create({
      data: dataToCreate,
    });
    
    res.status(201).json(created);
  } catch (e) { 
    console.error('Erreur création pipe:', e.message);
    next(e); 
  }
});

// GET /api/pipes/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const pipe = await prisma.pipe.findUnique({
      where: { id },
    });
    
    if (!pipe) {
      return res.status(404).json({ message: "Pipe non trouvée" });
    }
    
    res.json(pipe);
  } catch (e) { next(e); }
});

// PUT /api/pipes/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const b = req.body || {};

    const dataToUpdate = {};
    
    if (b.client !== undefined) dataToUpdate.client = b.client.trim();
    if (b.ic !== undefined) dataToUpdate.ic = b.ic.trim();
    if (b.secteur !== undefined) dataToUpdate.secteur = b.secteur.trim();
    if (b.projets !== undefined) dataToUpdate.projets = b.projets?.trim() || null;
    if (b.budget !== undefined) dataToUpdate.budget = Number(b.budget || 0);
    if (b.semestre !== undefined) dataToUpdate.semestre = b.semestre;

    const updated = await prisma.pipe.update({
      where: { id },
      data: dataToUpdate,
    });
    
    res.json(updated);
  } catch (e) { 
    console.error('Erreur update pipe:', e.message);
    next(e); 
  }
});

// DELETE /api/pipes/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.pipe.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { 
    console.error('Erreur delete pipe:', e.message);
    next(e); 
  }
});

export default router;