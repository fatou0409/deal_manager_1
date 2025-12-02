// scripts/migrate-owners.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOwners() {
  // Migration des propriétaires (logs supprimés pour production)
  
  // 1. Trouver un admin ou manager
  let defaultOwner = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!defaultOwner) {
    // Aucun admin trouvé, recherche d'un manager...
    defaultOwner = await prisma.user.findFirst({
      where: { role: 'MANAGER' }
    });
  }
  
  if (!defaultOwner) {
    // Aucun utilisateur ADMIN ou MANAGER trouvé. Créez d'abord un utilisateur ADMIN ou MANAGER.
    process.exit(1);
  }
  // Mettre à jour les deals sans propriétaire
  const dealsCount = await prisma.deal.updateMany({
    where: { ownerId: null },
    data: { ownerId: defaultOwner.id }
  });

  // Mettre à jour les visits sans propriétaire (utilise userId)
  const visitsCount = await prisma.visit.updateMany({
    where: { userId: null },
    data: { userId: defaultOwner.id }
  });

  // Mettre à jour les pipes sans propriétaire
  const pipesCount = await prisma.pipe.updateMany({
    where: { ownerId: null },
    data: { ownerId: defaultOwner.id }
  });

  // Résumé de la migration (logs supprimés dans le script)
}

migrateOwners()
  .catch((error) => {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

