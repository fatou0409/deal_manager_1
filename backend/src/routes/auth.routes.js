// src/routes/auth.routes.js
import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// POST /auth/login { email, password }
router.post('/login', async (req, res, next) => {
  try {
    const { errors, clean } = validate(req.body, {
      email: { type: 'email', required: true },
      password: { type: 'string', required: true, minLength: 6 }
    });
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Paramètres invalides', errors });
    }
    const { email, password } = clean;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.isActive) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  // Utiliser la durée configurable depuis les variables d'environnement
  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (e) { next(e); }
});

// POST /auth/change-password { currentPassword, newPassword }
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const me = await prisma.user.findUnique({ where: { id: req.user.id } });
    const ok = await bcrypt.compare(currentPassword, me.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Current password incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: me.id }, data: { passwordHash: hash } });
    res.json({ message: 'Password updated' });
  } catch (e) { next(e); }
});

// POST /auth/reset-admin { email, password, code }
// Route de reset admin accessible uniquement en développement
router.post('/reset-admin', async (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'Forbidden in production' });
  }
  try {
    const { email, password, code } = req.body;
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    if (!adminExists) {
      const hash = await bcrypt.hash(password, 10);
      const admin = await prisma.user.create({
        data: { email, passwordHash: hash, role: 'ADMIN', name: 'Admin' }
      });
      return res.json({ message: 'Admin created', admin: { id: admin.id, email: admin.email } });
    }

    if (code !== env.ADMIN_RESET_CODE) {
      return res.status(403).json({ message: 'Invalid reset code' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Admin not found' });
    if (user.role !== 'ADMIN') return res.status(400).json({ message: 'Not an admin account' });

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    res.json({ message: 'Admin password reset' });
  } catch (e) { next(e); }
});

export default router;
