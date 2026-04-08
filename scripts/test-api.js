/**
 * Script para testar APIs com autenticação JWT
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

// Gerar token JWT de teste
function generateTestToken() {
  const payload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
  return token;
}

async function testAPI() {
  console.log('=== Testando APIs com JWT ===\n');
  
  if (!process.env.JWT_SECRET) {
    console.log('ERRO: JWT_SECRET não está configurado no .env.local');
    console.log('Adicione: JWT_SECRET=seu-secret-aqui');
    return;
  }

  const token = generateTestToken();
  console.log('Token JWT gerado:', token.substring(0, 50) + '...');
  
  // Testar API de categorias
  try {
    const response = await fetch('http://localhost:3001/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('\nAPI Categories: SUCCESS');
      console.log('Resposta:', JSON.stringify(data, null, 2));
    } else {
      console.log('\nAPI Categories: ERROR', response.status);
      console.log('Resposta:', await response.text());
    }
  } catch (error) {
    console.log('\nAPI Categories: NETWORK ERROR');
    console.log('Erro:', error.message);
  }
}

// Executar teste
testAPI().catch(console.error);
