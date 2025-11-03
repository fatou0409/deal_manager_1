// src/middleware/roles.js
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/**
 * Middleware pour exiger que l'utilisateur ait l'un des rôles spécifiés.
 * @param {string[]} roles - Un tableau de rôles autorisés.
 */
export function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
