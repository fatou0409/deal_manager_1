// scripts/fix-all-data.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllData() {
  console.log('🔧 Correction complète des données...\n');
  
  // Trouver un propriétaire par défaut
  let defaultOwner = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!defaultOwner) {
    defaultOwner = await prisma.user.findFirst({
      where: { role: 'MANAGER' }
    });
  }
  
  if (!defaultOwner) {
    console.log('❌ Aucun admin/manager trouvé ! Créez-en un d\'abord.');
    return;
  }
  
  console.log(`✅ Propriétaire par défaut: ${defaultOwner.email} (${defaultOwner.id})\n`);
  
  // === DEALS ===
  console.log('📊 Vérification des Deals...');
  const allDeals = await prisma.deal.findMany();
  console.log(`   Total: ${allDeals.length}`);
  
  const dealsWithoutOwner = allDeals.filter(d => !d.ownerId);
  console.log(`   Sans ownerId: ${dealsWithoutOwner.length}`);
  
  if (dealsWithoutOwner.length > 0) {
    for (const deal of dealsWithoutOwner) {
      await prisma.deal.update({
        where: { id: deal.id },
        data: { ownerId: defaultOwner.id }
      });
    }
    console.log(`   ✅ ${dealsWithoutOwner.length} deals corrigés\n`);
  } else {
    console.log('   ✅ Tous les deals ont un propriétaire\n');
  }
  
  // === VISITS ===
  console.log('📊 Vérification des Visits...');
  const allVisits = await prisma.visit.findMany();
  console.log(`   Total: ${allVisits.length}`);
  
  const visitsWithoutUser = allVisits.filter(v => !v.userId);
  console.log(`   Sans userId: ${visitsWithoutUser.length}`);
  
  if (visitsWithoutUser.length > 0) {
    for (const visit of visitsWithoutUser) {
      await prisma.visit.update({
        where: { id: visit.id },
        data: { userId: defaultOwner.id }
      });
    }
    console.log(`   ✅ ${visitsWithoutUser.length} visits corrigés\n`);
  } else {
    console.log('   ✅ Toutes les visits ont un userId\n');
  }
  
  // === PIPES ===
  console.log('📊 Vérification des Pipes...');
  const allPipes = await prisma.pipe.findMany();
  console.log(`   Total: ${allPipes.length}`);
  
  const pipesWithoutOwner = allPipes.filter(p => !p.ownerId);
  console.log(`   Sans ownerId: ${pipesWithoutOwner.length}`);
  
  if (pipesWithoutOwner.length > 0) {
    for (const pipe of pipesWithoutOwner) {
      await prisma.pipe.update({
        where: { id: pipe.id },
        data: { ownerId: defaultOwner.id }
      });
    }
    console.log(`   ✅ ${pipesWithoutOwner.length} pipes corrigés\n`);
  } else {
    console.log('   ✅ Tous les pipes ont un propriétaire\n');
  }
  
  // === RÉSUMÉ FINAL ===
  console.log('✅ Correction terminée !\n');
  console.log('📊 État final de la base:');
  
  const finalDeals = await prisma.deal.count();
  const finalVisits = await prisma.visit.count();
  const finalPipes = await prisma.pipe.count();
  
  console.log(`   Deals: ${finalDeals}`);
  console.log(`   Visits: ${finalVisits}`);
  console.log(`   Pipes: ${finalPipes}`);
  
  // Vérifier qu'ils ont tous un propriétaire
  const dealsWithOwner = await prisma.deal.count({ where: { ownerId: { not: null } } });
  const visitsWithUser = await prisma.visit.count({ where: { userId: { not: null } } });
  const pipesWithOwner = await prisma.pipe.count({ where: { ownerId: { not: null } } });
  
  console.log('\n✅ Avec propriétaire:');
  console.log(`   Deals: ${dealsWithOwner}/${finalDeals}`);
  console.log(`   Visits: ${visitsWithUser}/${finalVisits}`);
  console.log(`   Pipes: ${pipesWithOwner}/${finalPipes}`);
}

fixAllData()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());