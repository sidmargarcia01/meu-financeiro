/**
 * CAMADA: Page
 * MODULO: Relatorios
 * RESPONSABILIDADE: Placeholder para o modulo de relatorios (a implementar)
 */

export const dynamic = 'force-dynamic'
export default function RelatoriosPage() {
  return (
    <div style={{ padding: '24px' }}>
      <h1>Relatórios</h1>
      <p>Escolha um relatório para visualizar análises detalhadas das suas finanças.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '24px' }}>
          <h3>DRE</h3>
          <p>Demonstrativo de Resultado do Exercício</p>
          <p>Veja receitas, despesas e resultado líquido por categoria e período.</p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '24px' }}>
          <h3>DFC</h3>
          <p>Demonstrativo de Fluxo de Caixa</p>
          <p>Acompanhe entradas e saídas cronológicas com saldo acumulado.</p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '24px' }}>
          <h3>Extrato Bancário</h3>
          <p>Extrato por conta com saldos projetados</p>
          <p>Visualize o extrato de cada conta com saldo projetado e confirmado.</p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '24px' }}>
          <h3>Fluxo de Caixa</h3>
          <p>Evolução mensal de receitas e despesas</p>
          <p>Gráfico comparativo de receitas, despesas e saldo por mês.</p>
        </div>
      </div>
    </div>
  )
}
