/**
 * Página de Categorias - Versão simplificada para teste
 */

'use client'

export default function CategoriasPage() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Categorias</h1>
      <p>Esta página está funcionando!</p>
      <button 
        onClick={() => alert('Botão clicado!')}
        style={{ 
          padding: '10px 20px', 
          background: '#1976d2', 
          color: 'white', 
          border: 'none', 
          borderRadius: 4,
          cursor: 'pointer',
          marginTop: 20
        }}
      >
        Testar Botão
      </button>
    </div>
  )
}
