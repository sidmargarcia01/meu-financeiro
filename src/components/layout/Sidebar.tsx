/**
 * 📄 Descrição: Menu lateral com 11 módulos na ordem exata dos documentos
 * 🧱 Contexto: Componente principal de navegação do layout autenticado
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, Material-UI
 * 🔍 Dependências: useNavigation, SidebarItem, SidebarGroup, SidebarFavorites, SidebarFooter
 * ✅ Revisado: Sim
 *
 * CAMADA: Component
 * MÓDULO: Layout - Sidebar
 * RESPONSABILIDADE: Menu lateral com 11 módulos — retrátil, favoritos, modo escuro no rodapé
 * NÃO DEVE: Conter lógica de negócio, fazer fetch, calcular saldos
 * DEPENDE DE: useNavigation, SidebarItem, SidebarGroup, SidebarFavorites, SidebarFooter
 */

'use client'

import { Box, Drawer, List, Divider, IconButton, Tooltip } from '@mui/material'
import {
  ChevronLeft, ChevronRight,
  Dashboard as DashboardIcon,
  Business as GestaoIcon,
  BarChart as DREIcon,
  ShowChart as DFCIcon,
  AccountBalance as BalancoIcon,
  Insights as IndicadoresIcon,
  CalendarMonth as PlanejamentoIcon,
  AccountBalanceWallet as MovIcon,
  FormatListBulleted as LancIcon,
  DateRange as FluxoIcon,
  ArrowCircleDown as APagarIcon,
  ArrowCircleUp as PagasIcon,
  Receipt as ExtratoIcon,
  CreditCard as CartaoIcon,
  TrackChanges as MetasIcon,
  MoneyOff as OrcIcon,
  Adjust as CentMetaIcon,
  Savings as EconIcon,
  Assessment as RelIcon,
  IntegrationInstructions as ContabilIcon,
  TrendingUp as InvestIcon,
  Category as CadastrosIcon,
  Label as CatIcon,
  Store as CentrosIcon,
  AccountBox as ContasIcon,
  Payment as FormasIcon,
  FolderOpen as ProjIcon,
  LocalOffer as TagIcon,
  Build as FerrIcon,
  Description as DocIcon,
  RequestQuote as PropIcon,
  Rule as RegrasIcon,
  Upload as ImportIcon,
  Lock as FechIcon,
  Settings as ConfigIcon,
} from '@mui/icons-material'
import { useNavigation } from '@/hooks/useNavigation'
import { SidebarItem } from './SidebarItem'
import { SidebarGroup } from './SidebarGroup'
import { SidebarFavorites } from './SidebarFavorites'
import { SidebarFooter } from './SidebarFooter'

const SIDEBAR_WIDTH = 260
const SIDEBAR_MINIMIZED_WIDTH = 64

export function Sidebar() {
  const {
    isRouteActive, isGroupCollapsed,
    isSidebarMinimized, toggleGroup, setSidebarMinimized,
  } = useNavigation()

  const mini = isSidebarMinimized

  const item = (
    key: string, label: string, href: string,
    icon: React.ReactNode, isChild = false
  ) => (
    <SidebarItem
      key={key} itemKey={key} label={label} href={href}
      icon={icon} isActive={isRouteActive(href)}
      isMinimized={mini} isChild={isChild}
      showFavorite={!isChild}
    />
  )

  const group = (
    key: string, label: string,
    icon: React.ReactNode, children: React.ReactNode
  ) => (
    <SidebarGroup
      key={key} label={label} icon={icon}
      isCollapsed={isGroupCollapsed(key)}
      isMinimized={mini}
      onToggle={() => toggleGroup(key)}
    >
      {children}
    </SidebarGroup>
  )

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: mini ? SIDEBAR_MINIMIZED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: mini ? SIDEBAR_MINIMIZED_WIDTH : SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Cabeçalho — logo e botão retrátil documentado */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent={mini ? 'center' : 'space-between'}
        px={mini ? 0 : 2}
        py={1.5}
        sx={{ minHeight: 64, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {!mini && (
          <Box component="span" fontWeight={700} fontSize={17} color="primary.main">
            Meu Financeiro
          </Box>
        )}
        <Tooltip title={mini ? 'Expandir menu' : 'Recolher menu'} placement="right">
          <IconButton size="small" onClick={() => setSidebarMinimized(!mini)}>
            {mini ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Favoritos no topo — "pinar itens para acesso rápido no topo" */}
      <SidebarFavorites isMinimized={mini} />

      {/* Navegação principal — 11 módulos na ordem exata dos documentos */}
      <List sx={{ flex: 1, overflowY: 'auto', pt: 1, pb: 1, px: 0 }}>

        {/* 1. Visão Geral */}
        {item('dashboard', 'Visão Geral', '/dashboard', <DashboardIcon fontSize="small" />)}

        <Divider sx={{ my: 1 }} />

        {/* 2. Gestão do Negócio — DRE, DFC, Balanço, Indicadores, Planejamento */}
        {group('gestao', 'Gestão do Negócio', <GestaoIcon fontSize="small" />, <>
          {item('dre', 'DRE', '/gestao/dre', <DREIcon fontSize="small" />, true)}
          {item('dfc', 'DFC', '/gestao/dfc', <DFCIcon fontSize="small" />, true)}
          {item('balanco', 'Balanço Patrimonial', '/gestao/balanco', <BalancoIcon fontSize="small" />, true)}
          {item('indicadores', 'Indicadores', '/gestao/indicadores', <IndicadoresIcon fontSize="small" />, true)}
          {item('planejamento', 'Planejamento', '/gestao/planejamento', <PlanejamentoIcon fontSize="small" />, true)}
        </>)}

        {/* 3. Movimentações e Caixa — Lançamentos, Fluxo, A Pagar, Pagas */}
        {group('movimentacoes', 'Movimentações e Caixa', <MovIcon fontSize="small" />, <>
          {item('lancamentos', 'Lançamentos', '/movimentacoes/lancamentos', <LancIcon fontSize="small" />, true)}
          {item('fluxo', 'Fluxo', '/movimentacoes/fluxo', <FluxoIcon fontSize="small" />, true)}
          {item('a-pagar', 'A Pagar e Receber', '/movimentacoes/a-pagar', <APagarIcon fontSize="small" />, true)}
          {item('pagas', 'Pagas e Recebidas', '/movimentacoes/pagas', <PagasIcon fontSize="small" />, true)}
        </>)}

        {/* 4. Extrato de Contas — Conciliação Bancária */}
        {item('extrato', 'Extrato de Contas', '/extrato', <ExtratoIcon fontSize="small" />)}

        {/* 5. Cartões de Crédito */}
        {item('cartoes', 'Cartões de Crédito', '/cartoes', <CartaoIcon fontSize="small" />)}

        <Divider sx={{ my: 1 }} />

        {/* 6. Metas — Orçamento, Centros, Economia */}
        {group('metas', 'Metas', <MetasIcon fontSize="small" />, <>
          {item('orcamento', 'Orçamento', '/metas/orcamento', <OrcIcon fontSize="small" />, true)}
          {item('metas-centros', 'Centros', '/metas/centros', <CentMetaIcon fontSize="small" />, true)}
          {item('economia', 'Economia', '/metas/economia', <EconIcon fontSize="small" />, true)}
        </>)}

        {/* 7. Relatórios */}
        {item('relatorios', 'Relatórios', '/relatorios', <RelIcon fontSize="small" />)}

        {/* 8. Integração Contábil */}
        {item('integracao-contabil', 'Integração Contábil', '/integracao-contabil', <ContabilIcon fontSize="small" />)}

        {/* 9. Investimentos */}
        {item('investimentos', 'Investimentos', '/investimentos', <InvestIcon fontSize="small" />)}

        <Divider sx={{ my: 1 }} />

        {/* 10. Cadastros — Categorias, Centros, Contas, Formas, Projetos, Tags */}
        {group('cadastros', 'Cadastros', <CadastrosIcon fontSize="small" />, <>
          {item('categorias', 'Categorias', '/cadastros/categorias', <CatIcon fontSize="small" />, true)}
          {item('centros', 'Centros', '/cadastros/centros', <CentrosIcon fontSize="small" />, true)}
          {item('contas', 'Contas', '/cadastros/contas', <ContasIcon fontSize="small" />, true)}
          {item('formas-pagamento', 'Formas de Pagamento', '/cadastros/formas-pagamento', <FormasIcon fontSize="small" />, true)}
          {item('projetos', 'Projetos', '/cadastros/projetos', <ProjIcon fontSize="small" />, true)}
          {item('tags', 'Tags', '/cadastros/tags', <TagIcon fontSize="small" />, true)}
        </>)}

        {/* 11. Ferramentas — Documentos, Propostas, Regras, Importação, Fechamento, Config */}
        {group('ferramentas', 'Ferramentas', <FerrIcon fontSize="small" />, <>
          {item('documentos', 'Documentos', '/ferramentas/documentos', <DocIcon fontSize="small" />, true)}
          {item('propostas', 'Propostas Comerciais', '/ferramentas/propostas', <PropIcon fontSize="small" />, true)}
          {item('regras', 'Regras de Preenchimento', '/ferramentas/regras', <RegrasIcon fontSize="small" />, true)}
          {item('importacao', 'Importar Lançamentos', '/ferramentas/importacao', <ImportIcon fontSize="small" />, true)}
          {item('fechamento', 'Fechamento de Posição', '/ferramentas/fechamento', <FechIcon fontSize="small" />, true)}
          {item('configuracoes', 'Configurações', '/ferramentas/configuracoes', <ConfigIcon fontSize="small" />, true)}
        </>)}

      </List>

      {/* Rodapé com modo escuro — "alternância de tema no rodapé do menu" */}
      <SidebarFooter isMinimized={mini} />

    </Drawer>
  )
}
