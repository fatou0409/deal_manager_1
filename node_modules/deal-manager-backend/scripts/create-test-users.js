// scripts/create-test-users.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  const password = await bcrypt.hash('password123', 10);
  
  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    create: {
      email: 'admin@test.com',
      passwordHash: password,
      name: 'Admin Test',
      role: 'ADMIN',
      isActive: true
    },
    update: {}
  });
  console.log('✅ Admin créé:', admin.email);
  
  // Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    create: {
      email: 'manager@test.com',
      passwordHash: password,
      name: 'Manager Test',
      role: 'MANAGER',
      isActive: true
    },
    update: {}
  });
  console.log('✅ Manager créé:', manager.email);
  
  // Business Developer
  const bd = await prisma.user.upsert({
    where: { email: 'bd@test.com' },
    create: {
      email: 'bd@test.com',
      passwordHash: password,
      name: 'BD Test',
      role: 'BUSINESS_DEVELOPER',
      isActive: true
    },
    update: {}
  });
  console.log('✅ Business Developer créé:', bd.email);
  
  // Guest
  const guest = await prisma.user.upsert({
    where: { email: 'guest@test.com' },
    create: {
      email: 'guest@test.com',
      passwordHash: password,
      name: 'Guest Test',
      role: 'GUEST',
      isActive: true
    },
    update: {}
  });
  console.log('✅ Guest créé:', guest.email);
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());