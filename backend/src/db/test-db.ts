import { db } from './connection.js';

async function testConnection() {
  try {
    await db.execute('SELECT 1');
    console.log('✅ Connexion MySQL réussie avec Drizzle');
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL :', error);
  }
}

testConnection();