/**
 * CAMADA: Page
 * MODULO: Relatorios
 * RESPONSABILIDADE: Placeholder para o modulo de relatorios (a implementar)
 */

/**
 * Descrição: Hub de Relatórios Financeiros
 * Contexto: Módulo 4 — rota /relatorios
 * Responsável: Windsurf AI
 * Data: 2026-04-07
 * Tecnologias: Next.js App Router, React, Material-UI
 * Revisado: Sim
 */

import Link from 'next/link'
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea, Stack,
} from '@mui/material'
import {
  BarChart as DreIcon,
  AccountBalance as DfcIcon,
  Receipt as ExtratoIcon,
  TrendingUp as FluxoIcon,
} from '@mui/icons-material'

const REPORTS = [
  {
    title: 'DRE',
    subtitle: 'Demonstrativo de Resultado do Exercício',
    description: 'Veja receitas, despesas e resultado líquido por categoria e período.',
    href: '/gestao/dre',
    icon: <DreIcon sx={{ fontSize: 40 }} />,
    color: 'primary.main',
  },
  {
    title: 'DFC',
    subtitle: 'Demonstrativo de Fluxo de Caixa',
    description: 'Acompanhe entradas e saídas cronológicas com saldo acumulado.',
    href: '/gestao/dfc',
    icon: <DfcIcon sx={{ fontSize: 40 }} />,
    color: 'success.main',
  },
  {
    title: 'Extrato Bancário',
    subtitle: 'Extrato por conta com saldos projetados',
    description: 'Visualize o extrato de cada conta com saldo projetado e confirmado.',
    href: '/movimentacoes/extrato',
    icon: <ExtratoIcon sx={{ fontSize: 40 }} />,
    color: 'info.main',
  },
  {
    title: 'Fluxo de Caixa',
    subtitle: 'Evolução mensal de receitas e despesas',
    description: 'Gráfico comparativo de receitas, despesas e saldo por mês.',
    href: '/movimentacoes/fluxo',
    icon: <FluxoIcon sx={{ fontSize: 40 }} />,
    color: 'warning.main',
  },
]

export default function RelatoriosPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={1}>Relatórios</Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Escolha um relatório para visualizar análises detalhadas das suas finanças.
      </Typography>

      <Grid container spacing={3}>
        {REPORTS.map(r => (
          <Grid key={r.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'grey.200' }}>
              <CardActionArea component={Link} href={r.href} sx={{ height: '100%', p: 1 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box color={r.color} mt={0.5}>{r.icon}</Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{r.title}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        {r.subtitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
