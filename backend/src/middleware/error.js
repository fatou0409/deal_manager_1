// backend/src/middleware/error.js

/**
 * Middleware de gestion globale des erreurs Express
 * La signature à 4 paramètres est OBLIGATOIRE pour qu'Express 
 * reconnaisse ce middleware comme un error handler
 */
export function errorHandler(err, req, res, next) {
  // Log de l'erreur pour le debug
  console.error('❌ Erreur serveur:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method
  });
  
  // Détermination du code de statut
  const status = err.status || err.statusCode || 500;
  
  // Réponse JSON
  res.status(status).json({ 
    message: err.message || "Erreur serveur interne",
    // En développement, on peut inclure plus de détails
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details 
    })
  });
}