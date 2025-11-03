// src/routes/users.routes.js
import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcrypt';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js'; // ✅ Importer requireRoles
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Admin/Manager list users (use permission so Manager allowed when configured)
router.get('/', authenticate, requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
    });
    res.json(users);
  } catch (e) { next(e); }
});

// Admin create user
router.post('/', authenticate, requireRoles(['ADMIN']), async (req, res, next) => {
  try {
    const { errors, clean } = validate(req.body, {
      email: { type: 'email', required: true },
      password: { type: 'string', required: true, minLength: 6 },
      name: { type: 'string', minLength: 2, maxLength: 50 },
      role: { type: 'string', required: true }
    });
    
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Paramètres invalides', errors: errors });
    }
    
    const { email, password, name, role } = clean;
    
    // ✅ CORRIGÉ : utilise BUSINESS_DEVELOPER au lieu de BD
    const allowedRoles = ['ADMIN', 'MANAGER', 'BUSINESS_DEVELOPER', 'GUEST'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ 
      data: { email, passwordHash: hash, name, role } 
    });
    
    res.status(201).json({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name 
    });
  } catch (e) { next(e); }
});

// Admin update user (role, active, name)
router.patch('/:id', authenticate, requireRoles(['ADMIN']), async (req, res, next) => {
  try {
    const { name, role, isActive, password } = req.body;
    const data = {};
    
    if (name !== undefined) data.name = name;
    
    if (role !== undefined) {
      // ✅ CORRIGÉ : utilise BUSINESS_DEVELOPER au lieu de BD
      const allowedRoles = ['ADMIN', 'MANAGER', 'BUSINESS_DEVELOPER', 'GUEST'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide' });
      }
      data.role = role;
    }
    
    if (isActive !== undefined) data.isActive = isActive;
    
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      data.passwordHash = hash;
    }
    
    const user = await prisma.user.update({ 
      where: { id: req.params.id }, 
      data 
    });
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name, 
      isActive: user.isActive 
    });
  } catch (e) { next(e); }
});

// Admin delete user
router.delete('/:id', authenticate, requireRoles(['ADMIN']), async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;