// scripts/verify-and-fix-admin.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verifyAndFixAdmin() {
  console.log('🔍 Vérification de l\'admin...\n');
  
  const ADMIN_EMAIL = 'admin@deal.local';
  const ADMIN_PASSWORD = 'ChangeMe#2025';
  
  try {
    // 1. Compter tous les utilisateurs
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total utilisateurs dans la base: ${totalUsers}`);
    
    // 2. Chercher l'admin existant
    let admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    });
    
    if (!admin) {
      console.log('❌ Admin introuvable ! Création d\'un nouvel admin...');
      
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      admin = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          passwordHash: hash,
          name: 'Admin',
          role: 'ADMIN',
          isActive: true
        }
      });
      
      console.log('✅ Nouvel admin créé:', admin.email);
    } else {
      console.log('✅ Admin trouvé dans la base:');
      console.log('   Email:', admin.email);
      console.log('   Rôle:', admin.role);
      console.log('   Actif:', admin.isActive);
      console.log('   ID:', admin.id);
      
      // Vérifier si le mot de passe est correct
      console.log('\n🔐 Vérification du mot de passe...');
      const isPasswordValid = await bcrypt.compare(ADMIN_PASSWORD, admin.passwordHash);
      
      if (!isPasswordValid) {
        console.log('⚠️  Mot de passe incorrect ! Mise à jour...');
        const newHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await prisma.user.update({
          where: { id: admin.id },
          data: { passwordHash: newHash }
        });
        console.log('✅ Mot de passe mis à jour');
      } else {
        console.log('✅ Mot de passe correct');
      }
      
      // Réactiver si désactivé
      if (!admin.isActive) {
        console.log('⚠️  Admin désactivé ! Réactivation...');
        await prisma.user.update({
          where: { id: admin.id },
          data: { isActive: true }
        });
        console.log('✅ Admin réactivé');
      }
      
      // S'assurer que le rôle est bien ADMIN
      if (admin.role !== 'ADMIN') {
        console.log('⚠️  Rôle incorrect ! Correction...');
        await prisma.user.update({
          where: { id: admin.id },
          data: { role: 'ADMIN' }
        });
        console.log('✅ Rôle corrigé en ADMIN');
      }
    }
    
    // 3. Vérifier que l'admin peut bien faire des queries avec relations
    console.log('\n🔗 Vérification des relations...');
    try {
      const adminWithRelations = await prisma.user.findUnique({
        where: { id: admin.id },
        include: {
          deals: true,
          visits: true,
          pipes: true,
          objectives: true
        }
      });
      
      console.log('✅ Relations OK:');
      console.log('   Deals:', adminWithRelations.deals?.length || 0);
      console.log('   Visits:', adminWithRelations.visits?.length || 0);
      console.log('   Pipes:', adminWithRelations.pipes?.length || 0);
      console.log('   Objectives:', adminWithRelations.objectives?.length || 0);
    } catch (e) {
      console.error('\n❌ PROBLÈME avec les relations:', e.message);
      console.log('💡 Cela peut être normal si les migrations sont en cours');
    }
    
    // 4. Lister TOUS les utilisateurs pour debug
    console.log('\n📋 Liste de tous les utilisateurs:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.table(allUsers);
    
    // 5. Statistiques par rôle
    console.log('\n📊 Statistiques par rôle:');
    const roleStats = {
      ADMIN: allUsers.filter(u => u.role === 'ADMIN').length,
      MANAGER: allUsers.filter(u => u.role === 'MANAGER').length,
      BUSINESS_DEVELOPER: allUsers.filter(u => u.role === 'BUSINESS_DEVELOPER').length,
      GUEST: allUsers.filter(u => u.role === 'GUEST').length
    };
    console.table(roleStats);
    
    // 6. Test de connexion simulé
    console.log('\n🧪 Test de connexion simulé...');
    const testAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    });
    
    const canLogin = await bcrypt.compare(ADMIN_PASSWORD, testAdmin.passwordHash);
    
    if (canLogin && testAdmin.isActive && testAdmin.role === 'ADMIN') {
      console.log('✅ SUCCÈS ! Vous pouvez vous connecter avec:');
      console.log('   Email:', ADMIN_EMAIL);
      console.log('   Mot de passe:', ADMIN_PASSWORD);
    } else {
      console.log('❌ PROBLÈME de connexion détecté:');
      console.log('   Mot de passe valide:', canLogin);
      console.log('   Compte actif:', testAdmin.isActive);
      console.log('   Rôle ADMIN:', testAdmin.role === 'ADMIN');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur critique:', error.message);
    console.error(error);
  }
}

verifyAndFixAdmin()
  .then(() => {
    console.log('\n✅ Vérification terminée avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());