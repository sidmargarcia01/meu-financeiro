/**
 * Script para testar APIs após configuração
 */

require('dotenv').config({ path: '.env.local' });

async function testAPIs() {
  console.log('=== Testando APIs ===\n');
  
  const baseUrl = 'http://localhost:3001/api';
  const apis = ['categories', 'cost-centers', 'projects', 'tags', 'contacts', 'payment-methods'];
  
  for (const api of apis) {
    try {
      const response = await fetch(`${baseUrl}/${api}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${api}: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);
    } catch (error) {
      console.log(`${api}: NETWORK ERROR - ${error.message}`);
    }
  }
}

testAPIs().catch(console.error);
