// scripts/create-bd2.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createBD2() {
  const hash = await bcrypt.hash('password123', 10);
  
  const bd2 = await prisma.user.upsert({
    where: { email: 'bd2@test.com' },
    create: {
      email: 'bd2@test.com',
      passwordHash: hash,
      name: 'Business Dev 2',
      role: 'BUSINESS_DEVELOPER',
      isActive: true
    },
    update: {}
  });
  
  console.log('✅ BD2 créé:', bd2.email);
}

createBD2().finally(() => prisma.$disconnect());