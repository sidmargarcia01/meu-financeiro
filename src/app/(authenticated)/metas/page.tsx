/**
 * 📄 Descrição: Hub de Metas Financeiras
 * 🧱 Contexto: Módulo 6 — rota /metas
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * ✅ Revisado: Sim
 */

import Link from 'next/link'
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Stack } from '@mui/material'
import {
  PieChart as OrcamentoIcon,
  Savings as EconomiaIcon,
  AccountTree as CentrosIcon,
} from '@mui/icons-material'

const METAS_LINKS = [
  {
    title: 'Orçamento por Categoria',
    subtitle: 'Defina limites de gasto por categoria e acompanhe a execução.',
    href: '/metas/orcamento',
    icon: <OrcamentoIcon sx={{ fontSize: 40 }} />,
    color: 'primary.main',
  },
  {
    title: 'Metas de Economia',
    subtitle: 'Crie e gerencie metas de economia e acompanhe o progresso.',
    href: '/metas/economia',
    icon: <EconomiaIcon sx={{ fontSize: 40 }} />,
    color: 'success.main',
  },
  {
    title: 'Metas por Centro de Custo',
    subtitle: 'Aplique orçamentos vinculados a centros de custo específicos.',
    href: '/metas/centros',
    icon: <CentrosIcon sx={{ fontSize: 40 }} />,
    color: 'info.main',
  },
]

export default function MetasPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={1}>Metas Financeiras</Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Defina orçamentos, metas de economia e acompanhe sua evolução financeira.
      </Typography>
      <Grid container spacing={3}>
        {METAS_LINKS.map(m => (
          <Grid key={m.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'grey.200' }}>
              <CardActionArea component={Link} href={m.href} sx={{ height: '100%', p: 1 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box color={m.color} mt={0.5}>{m.icon}</Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{m.title}</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{m.subtitle}</Typography>
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
