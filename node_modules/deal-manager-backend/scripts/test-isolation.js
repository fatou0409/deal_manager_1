// scripts/test-isolation.js
import fetch from 'node-fetch';

async function testIsolation() {
  console.log('🧪 Test d\'isolation Business Developer\n');
  
  const BD1 = { email: 'bd@test.com', password: 'password123' };
  const BD2 = { email: 'bd2@test.com', password: 'password123' };
  
  try {
    // ===== LOGIN BD1 =====
    console.log('1️⃣ Connexion BD1...');
    const login1 = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BD1)
    });
    
    if (!login1.ok) {
      const err = await login1.text();
      console.error('❌ Erreur login BD1:', err);
      return;
    }
    
    const data1 = await login1.json();
    const token1 = data1.token;
    console.log('✅ BD1 connecté:', BD1.email);
    console.log('   User ID:', data1.user.id);
    
    // ===== CRÉER UN DEAL POUR BD1 =====
    console.log('\n2️⃣ Création d\'un deal par BD1...');
    const createDeal = await fetch('http://localhost:4001/api/deals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        projet: 'Deal BD1 PRIVÉ',
        client: 'Client Confidentiel',
        secteur: 'Tech',
        semestre: '2025-S1',
        ca: 10000,
        marge: 2000,
        statut: 'En cours'
      })
    });
    
    if (!createDeal.ok) {
      const err = await createDeal.text();
      console.error('❌ Erreur création deal:', err);
      return;
    }
    
    const dealCreated = await createDeal.json();
    console.log('✅ Deal créé par BD1:');
    console.log('   ID:', dealCreated.id);
    console.log('   Projet:', dealCreated.projet);
    console.log('   OwnerId:', dealCreated.ownerId);
    
    // ===== LOGIN BD2 =====
    console.log('\n3️⃣ Connexion BD2...');
    const login2 = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BD2)
    });
    
    if (!login2.ok) {
      const err = await login2.text();
      console.error('❌ Erreur login BD2:', err);
      console.log('💡 Créez BD2 avec: node scripts/create-test-users.js');
      return;
    }
    
    const data2 = await login2.json();
    const token2 = data2.token;
    console.log('✅ BD2 connecté:', BD2.email);
    console.log('   User ID:', data2.user.id);
    
    // ===== BD2 ESSAIE DE VOIR LES DEALS =====
    console.log('\n4️⃣ BD2 récupère ses deals...');
    const getDeals = await fetch('http://localhost:4001/api/deals?semestre=2025-S1', {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    
    if (!getDeals.ok) {
      const err = await getDeals.text();
      console.error('❌ Erreur récupération deals:', err);
      return;
    }
    
    const dealsBD2 = await getDeals.json();
    
    // Vérifier que c'est bien un tableau
    if (!Array.isArray(dealsBD2)) {
      console.error('❌ La réponse n\'est pas un tableau:', dealsBD2);
      return;
    }
    
    console.log('✅ Deals visibles par BD2:', dealsBD2.length);
    
    if (dealsBD2.length > 0) {
      console.log('   Projets visibles:');
      dealsBD2.forEach(d => {
        console.log(`     - ${d.projet} (Owner: ${d.ownerId})`);
      });
    } else {
      console.log('   Aucun deal visible (normal si BD2 n\'a pas créé de deals)');
    }
    
    // ===== VÉRIFIER L'ISOLATION =====
    console.log('\n5️⃣ Vérification de l\'isolation...');
    const canSeeBD1Deal = dealsBD2.some(d => d.id === dealCreated.id);
    
    if (canSeeBD1Deal) {
      console.log('❌ ❌ ❌ PROBLÈME CRITIQUE: BD2 peut voir le deal de BD1 !');
      console.log('   Deal visible:', dealsBD2.find(d => d.id === dealCreated.id));
      console.log('   🚨 L\'ISOLATION DES DONNÉES NE FONCTIONNE PAS !');
    } else {
      console.log('✅ ✅ ✅ SUCCÈS: BD2 ne voit PAS le deal de BD1');
      console.log('   L\'isolation des données fonctionne correctement !');
    }
    
    // ===== BD2 ESSAIE DE MODIFIER LE DEAL DE BD1 =====
    console.log('\n6️⃣ BD2 essaie de modifier le deal de BD1...');
    const updateDeal = await fetch(`http://localhost:4001/api/deals/${dealCreated.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({
        projet: 'MODIFIÉ PAR BD2 (HACK!)'
      })
    });
    
    if (updateDeal.ok) {
      console.log('❌ ❌ ❌ PROBLÈME CRITIQUE: BD2 a pu modifier le deal de BD1 !');
      console.log('   🚨 LA PROTECTION DES MODIFICATIONS NE FONCTIONNE PAS !');
    } else {
      console.log('✅ ✅ ✅ SUCCÈS: BD2 ne peut PAS modifier le deal de BD1');
      console.log('   Status:', updateDeal.status, updateDeal.statusText);
      const errMsg = await updateDeal.text();
      console.log('   Message:', errMsg);
    }
    
    // ===== BD2 ESSAIE DE SUPPRIMER LE DEAL DE BD1 =====
    console.log('\n7️⃣ BD2 essaie de supprimer le deal de BD1...');
    const deleteDeal = await fetch(`http://localhost:4001/api/deals/${dealCreated.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token2}`
      }
    });
    
    if (deleteDeal.ok) {
      console.log('❌ ❌ ❌ PROBLÈME CRITIQUE: BD2 a pu supprimer le deal de BD1 !');
      console.log('   🚨 LA PROTECTION DES SUPPRESSIONS NE FONCTIONNE PAS !');
    } else {
      console.log('✅ ✅ ✅ SUCCÈS: BD2 ne peut PAS supprimer le deal de BD1');
      console.log('   Status:', deleteDeal.status, deleteDeal.statusText);
    }
    
    // ===== RÉSUMÉ =====
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DU TEST D\'ISOLATION');
    console.log('='.repeat(60));
    console.log('✅ BD1 peut créer des deals');
    console.log(canSeeBD1Deal ? '❌ BD2 peut voir les deals de BD1' : '✅ BD2 ne voit PAS les deals de BD1');
    console.log(updateDeal.ok ? '❌ BD2 peut modifier les deals de BD1' : '✅ BD2 ne peut PAS modifier les deals de BD1');
    console.log(deleteDeal.ok ? '❌ BD2 peut supprimer les deals de BD1' : '✅ BD2 ne peut PAS supprimer les deals de BD1');
    console.log('='.repeat(60));
    
    if (!canSeeBD1Deal && !updateDeal.ok && !deleteDeal.ok) {
      console.log('🎉 TOUS LES TESTS PASSENT ! L\'ISOLATION EST PARFAITE !');
    } else {
      console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ. VÉRIFIEZ LES MIDDLEWARES !');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error);
  }
}

testIsolation();