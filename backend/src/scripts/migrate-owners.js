// scripts/migrate-owners.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOwners() {
  console.log('🔄 Migration des propriétaires...');
  
  // 1. Trouver un admin ou manager
  let defaultOwner = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!defaultOwner) {
    console.log('⚠️  Aucun admin trouvé, recherche d\'un manager...');
    defaultOwner = await prisma.user.findFirst({
      where: { role: 'MANAGER' }
    });
  }
  
  if (!defaultOwner) {
    console.log('❌ Aucun utilisateur ADMIN ou MANAGER trouvé !');
    console.log('💡 Créez d\'abord un utilisateur avec le rôle ADMIN ou MANAGER');
    process.exit(1);
  }
  
  console.log(`✅ Propriétaire par défaut: ${defaultOwner.email} (${defaultOwner.role})`);
  
  // 2. Mettre à jour les deals sans propriétaire
  const dealsCount = await prisma.deal.updateMany({
    where: { ownerId: null },
    data: { ownerId: defaultOwner.id }
  });
  console.log(`✅ ${dealsCount.count} deals mis à jour`);
  
  // 3. Mettre à jour les visits sans propriétaire (utilise userId, pas ownerId!)
  const visitsCount = await prisma.visit.updateMany({
    where: { userId: null },
    data: { userId: defaultOwner.id }
  });
  console.log(`✅ ${visitsCount.count} visits mis à jour`);
  
  // 4. Mettre à jour les pipes sans propriétaire
  const pipesCount = await prisma.pipe.updateMany({
    where: { ownerId: null },
    data: { ownerId: defaultOwner.id }
  });
  console.log(`✅ ${pipesCount.count} pipes mis à jour`);
  
  console.log('\n✅ Migration terminée avec succès !');
  console.log(`📊 Total: ${dealsCount.count + visitsCount.count + pipesCount.count} enregistrements mis à jour`);
}

migrateOwners()
  .catch((error) => {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

