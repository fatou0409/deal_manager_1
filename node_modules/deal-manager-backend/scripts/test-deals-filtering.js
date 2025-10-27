import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Récupérer les BD
  const bd1 = await prisma.user.findFirst({
    where: { email: 'bd1@test.com' } // REMPLACER par le vrai email
  });
  
  const bd2 = await prisma.user.findFirst({
    where: { email: 'bd2@test.com' } // REMPLACER par le vrai email
  });

  console.log('BD 1:', bd1.name, '-', bd1.id);
  console.log('BD 2:', bd2.name, '-', bd2.id);

  // 2. Récupérer tous les deals
  const allDeals = await prisma.deal.findMany({
    select: { id: true, projet: true }
  });

  console.log(`\nTotal deals: ${allDeals.length}`);

  // 3. Répartir 50/50
  const half = Math.ceil(allDeals.length / 2);

  // Assigner la première moitié à BD1
  for (let i = 0; i < half; i++) {
    await prisma.deal.update({
      where: { id: allDeals[i].id },
      data: { ownerId: bd1.id }
    });
    console.log(`✅ ${allDeals[i].projet} → ${bd1.name}`);
  }

  // Assigner la seconde moitié à BD2
  for (let i = half; i < allDeals.length; i++) {
    await prisma.deal.update({
      where: { id: allDeals[i].id },
      data: { ownerId: bd2.id }
    });
    console.log(`✅ ${allDeals[i].projet} → ${bd2.name}`);
  }

  console.log('\n✅ Réassignation terminée !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());