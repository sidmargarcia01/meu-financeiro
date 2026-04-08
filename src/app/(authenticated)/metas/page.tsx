/**
 * 📄 Descrição: Hub de Metas Financeiras
 * 🧱 Contexto: Módulo 6 — rota /metas
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * ✅ Revisado: Sim
 */

/**
 * CAMADA: Page
 * MÓDULO: Metas
 * RESPONSABILIDADE: Placeholder para hub de metas financeiras
 */

'use client'

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
    <div style={{ padding: '24px' }}>
      <h1>Metas Financeiras</h1>
      <p>Defina orçamentos, metas de economia e acompanhe sua evolução financeira.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '24px' }}>
          <h3>Orçamento por Categoria</h3>
          <p>Defina limites de gasto por categoria e acompanhe a execução.</p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '24px' }}>
          <h3>Metas de Economia</h3>
          <p>Crie e gerencie metas de economia e acompanhe o progresso.</p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '24px' }}>
          <h3>Metas por Centro de Custo</h3>
          <p>Aplique orçamentos vinculados a centros de custo específicos.</p>
        </div>
      </div>
    </div>
  )
}
