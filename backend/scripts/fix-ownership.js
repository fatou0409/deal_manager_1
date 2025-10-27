// scripts/fix-ownership.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOwnership() {
  console.log('🔧 Correction des propriétaires manquants...\n');
  
  // Trouver un admin ou manager comme propriétaire par défaut
  let defaultOwner = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!defaultOwner) {
    defaultOwner = await prisma.user.findFirst({
      where: { role: 'MANAGER' }
    });
  }
  
  if (!defaultOwner) {
    console.log('❌ Aucun admin/manager trouvé !');
    return;
  }
  
  console.log(`✅ Propriétaire par défaut: ${defaultOwner.email}\n`);
  
  // Compter les données sans propriétaire
  const dealsWithoutOwner = await prisma.deal.count({
    where: { OR: [{ ownerId: null }, { ownerId: undefined }] }
  });
  
  const visitsWithoutOwner = await prisma.visit.count({
    where: { OR: [{ userId: null }, { userId: undefined }] }
  });
  
  const pipesWithoutOwner = await prisma.pipe.count({
    where: { OR: [{ ownerId: null }, { ownerId: undefined }] }
  });
  
  console.log('📊 Données sans propriétaire:');
  console.log(`   Deals: ${dealsWithoutOwner}`);
  console.log(`   Visits: ${visitsWithoutOwner}`);
  console.log(`   Pipes: ${pipesWithoutOwner}\n`);
  
  // Corriger les deals
  if (dealsWithoutOwner > 0) {
    const updated = await prisma.deal.updateMany({
      where: { OR: [{ ownerId: null }, { ownerId: undefined }] },
      data: { ownerId: defaultOwner.id }
    });
    console.log(`✅ ${updated.count} deals mis à jour`);
  }
  
  // Corriger les visits (utilise userId, pas ownerId!)
  if (visitsWithoutOwner > 0) {
    const updated = await prisma.visit.updateMany({
      where: { OR: [{ userId: null }, { userId: undefined }] },
      data: { userId: defaultOwner.id }
    });
    console.log(`✅ ${updated.count} visits mis à jour`);
  }
  
  // Corriger les pipes
  if (pipesWithoutOwner > 0) {
    const updated = await prisma.pipe.updateMany({
      where: { OR: [{ ownerId: null }, { ownerId: undefined }] },
      data: { ownerId: defaultOwner.id }
    });
    console.log(`✅ ${updated.count} pipes mis à jour`);
  }
  
  console.log('\n✅ Correction terminée !');
  
  // Afficher un résumé
  console.log('\n📊 État final:');
  const totalDeals = await prisma.deal.count();
  const totalVisits = await prisma.visit.count();
  const totalPipes = await prisma.pipe.count();
  
  console.log(`   Deals: ${totalDeals}`);
  console.log(`   Visits: ${totalVisits}`);
  console.log(`   Pipes: ${totalPipes}`);
}

fixOwnership()
  .catch(console.error)
  .finally(() => prisma.$disconnect());