// Définition des rôles
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  BUSINESS_DEVELOPER: 'BUSINESS_DEVELOPER',
  GUEST: 'GUEST'
};

// Définition des permissions
export const PERMISSIONS = {
  // Gestion complète (Admin/Manager)
  VIEW_ALL_DATA: 'view_all_data',
  EDIT_ALL_DATA: 'edit_all_data',
  
  // Gestion des utilisateurs (Admin uniquement)
  MANAGE_USERS: 'manage_users',
  
  // Objectifs
  SET_OBJECTIVES: 'set_objectives',
  VIEW_ALL_OBJECTIVES: 'view_all_objectives',
  
  // Données personnelles
  MANAGE_OWN_DATA: 'manage_own_data',
  VIEW_OWN_DATA: 'view_own_data',
  
  // Dashboard
  VIEW_GLOBAL_DASHBOARD: 'view_global_dashboard',
  FILTER_DASHBOARD: 'filter_dashboard',
  
  // Deals
  CREATE_DEAL: 'deal:create',
  EDIT_OWN_DEAL: 'deal:update',
  DELETE_OWN_DEAL: 'deal:delete',
  VIEW_ALL_DEALS: 'deal:view_all',
  
  // Visits
  CREATE_VISIT: 'visit:create',
  EDIT_OWN_VISIT: 'visit:update',
  DELETE_OWN_VISIT: 'visit:delete',
  VIEW_ALL_VISITS: 'visit:view_all',
  
  // Pipes (incluant import/export explicites)
  CREATE_PIPE: 'pipe:create',
  EDIT_OWN_PIPE: 'pipe:update',
  DELETE_OWN_PIPE: 'pipe:delete',
  VIEW_ALL_PIPES: 'pipe:view_all',
  IMPORT_PIPES: 'pipe:import',
  EXPORT_PIPES: 'pipe:export',
};

// Matrice de permissions par rôle
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.EDIT_ALL_DATA,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.SET_OBJECTIVES,
    PERMISSIONS.VIEW_ALL_OBJECTIVES,
    PERMISSIONS.VIEW_GLOBAL_DASHBOARD,
    PERMISSIONS.FILTER_DASHBOARD,
    PERMISSIONS.MANAGE_OWN_DATA,
    PERMISSIONS.VIEW_OWN_DATA,
    // Deals
    PERMISSIONS.CREATE_DEAL,
    PERMISSIONS.EDIT_OWN_DEAL,
    PERMISSIONS.DELETE_OWN_DEAL,
    PERMISSIONS.VIEW_ALL_DEALS,
    // Visits
    PERMISSIONS.CREATE_VISIT,
    PERMISSIONS.EDIT_OWN_VISIT,
    PERMISSIONS.DELETE_OWN_VISIT,
    PERMISSIONS.VIEW_ALL_VISITS,
    // Pipes
    PERMISSIONS.CREATE_PIPE,
    PERMISSIONS.EDIT_OWN_PIPE,
    PERMISSIONS.DELETE_OWN_PIPE,
    PERMISSIONS.VIEW_ALL_PIPES,
    PERMISSIONS.IMPORT_PIPES,
    PERMISSIONS.EXPORT_PIPES,
  ],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.EDIT_ALL_DATA,
    PERMISSIONS.MANAGE_USERS, // ✅ AJOUT : Le Manager peut maintenant lister les utilisateurs pour les filtres
    PERMISSIONS.SET_OBJECTIVES,
    PERMISSIONS.VIEW_ALL_OBJECTIVES,
    PERMISSIONS.VIEW_GLOBAL_DASHBOARD,
    PERMISSIONS.FILTER_DASHBOARD,
    PERMISSIONS.MANAGE_OWN_DATA,
    PERMISSIONS.VIEW_OWN_DATA,
    // Deals
    PERMISSIONS.CREATE_DEAL,
    PERMISSIONS.EDIT_OWN_DEAL,
    PERMISSIONS.DELETE_OWN_DEAL,
    PERMISSIONS.VIEW_ALL_DEALS,
    // Visits
    PERMISSIONS.CREATE_VISIT,
    PERMISSIONS.EDIT_OWN_VISIT,
    PERMISSIONS.DELETE_OWN_VISIT,
    PERMISSIONS.VIEW_ALL_VISITS,
    // Pipes
    PERMISSIONS.CREATE_PIPE,
    PERMISSIONS.EDIT_OWN_PIPE,
    PERMISSIONS.DELETE_OWN_PIPE,
    PERMISSIONS.VIEW_ALL_PIPES,
    PERMISSIONS.IMPORT_PIPES,
    PERMISSIONS.EXPORT_PIPES,
  ],
  
  [ROLES.BUSINESS_DEVELOPER]: [
    PERMISSIONS.MANAGE_OWN_DATA,
    PERMISSIONS.VIEW_OWN_DATA,
    PERMISSIONS.FILTER_DASHBOARD,
    // Deals
    PERMISSIONS.CREATE_DEAL,
    PERMISSIONS.EDIT_OWN_DEAL,
    PERMISSIONS.DELETE_OWN_DEAL,
    // Visits
    PERMISSIONS.CREATE_VISIT,
    PERMISSIONS.EDIT_OWN_VISIT,
    PERMISSIONS.DELETE_OWN_VISIT,
    // Pipes (incluant import/export)
    PERMISSIONS.CREATE_PIPE,
    PERMISSIONS.EDIT_OWN_PIPE,
    PERMISSIONS.DELETE_OWN_PIPE,
    PERMISSIONS.IMPORT_PIPES,
    PERMISSIONS.EXPORT_PIPES,
  ],
  
  [ROLES.GUEST]: [
    PERMISSIONS.VIEW_GLOBAL_DASHBOARD,
  ]
};

/**
 * Vérifie si un utilisateur a une permission
 */
export function hasPermission(userRole, permission) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Middleware pour vérifier une permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        message: 'Accès refusé',
        required: permission
      });
    }
    
    next();
  };
}

/**
 * Middleware de filtrage automatique selon le rôle
 * Pour les routes GET qui listent des ressources
 */
export function applyOwnershipFilter(req, res, next) {
  const { role, id: userId } = req.user;
  
  // Admin et Manager : peuvent tout voir
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    req.ownershipFilter = {}; // Pas de filtre
    return next();
  }
  
  // BD : ne voit que ses données
  if (role === ROLES.BUSINESS_DEVELOPER) {
    req.ownershipFilter = { ownerId: userId };
    return next();
  }
  
  // Guest : ne voit rien (ou tout en lecture seule selon votre logique)
  req.ownershipFilter = { id: 'impossible' }; // Filtre qui ne matche jamais
  return next();
}

/**
 * Middleware de vérification de propriété d'une ressource
 * Pour les routes PUT/DELETE sur une ressource spécifique
 */
export function requireOwnership(model) {
  return async (req, res, next) => {
    const { role, id: userId } = req.user;
    const resourceId = req.params.id;
    
    // Admin et Manager peuvent modifier toutes les ressources
    if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
      return next();
    }
    
    // BD : vérifier qu'il est propriétaire
    if (role === ROLES.BUSINESS_DEVELOPER) {
      try {
        const { prisma } = await import('../utils/prisma.js');
        
        const resource = await prisma[model].findUnique({
          where: { id: resourceId },
          select: { ownerId: true }
        });
        
        if (!resource) {
          return res.status(404).json({ message: 'Ressource non trouvée' });
        }
        
        if (resource.ownerId !== userId) {
          return res.status(403).json({ 
            message: 'Accès refusé : vous ne pouvez modifier que vos propres données'
          });
        }
        
        return next();
      } catch (error) {
        return res.status(500).json({ message: 'Erreur lors de la vérification' });
      }
    }
    
    // Guest : pas d'accès
    return res.status(403).json({ message: 'Accès refusé' });
  };
}

/**
 * Middleware pour s'assurer que l'ownerId est défini lors de la création
 */
export function ensureOwnerId(req, res, next) {
  const { role, id: userId } = req.user;
  
  // Pour les BD, forcer l'ownerId à leur propre ID
  if (role === ROLES.BUSINESS_DEVELOPER) {
    req.body.ownerId = userId;
    return next();
  }
  
  // Pour Admin/Manager, utiliser l'ownerId fourni ou le leur par défaut
  if (!req.body.ownerId) {
    req.body.ownerId = userId;
  }
  
  next();
}
