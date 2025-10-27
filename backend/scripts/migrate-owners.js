import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOwners() {
  console.log('🔄 Migration des propriétaires...');
  
  let defaultOwner = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!defaultOwner) {
    console.log('Recherche d un manager...');
    defaultOwner = await prisma.user.findFirst({
      where: { role: 'MANAGER' }
    });
  }
  
  if (!defaultOwner) {
    console.log('Aucun utilisateur ADMIN ou MANAGER trouve');
    console.log('Creez d abord un utilisateur avec le role ADMIN ou MANAGER');
    process.exit(1);
  }
  
  console.log('Proprietaire par defaut: ' + defaultOwner.email);
  
  const dealsCount = await prisma.deal.updateMany({
    where: { ownerId: null },
    data: { ownerId: defaultOwner.id }
  });
  console.log(dealsCount.count + ' deals mis a jour');
  
  const visitsCount = await prisma.visit.updateMany({
    where: { userId: null },
    data: { userId: defaultOwner.id }
  });
  console.log(visitsCount.count + ' visits mis a jour');
  
  const pipesCount = await prisma.pipe.updateMany({
    where: { ownerId: null },
    data: { ownerId: defaultOwner.id }
  });
  console.log(pipesCount.count + ' pipes mis a jour');
  
  console.log('Migration terminee avec succes');
}

migrateOwners()
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
