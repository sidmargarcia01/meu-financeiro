/**
 * CAMADA: Component
 * MODULO: Layout - Sidebar
 * RESPONSABILIDADE: Renderizar a navegacao lateral completa com os 8 grupos
 *                   conforme especificado nos documentos de analise do sistema original
 * NAO DEVE: Conter logica de negocio, fazer fetch, calcular saldos
 * DEPENDE DE: useNavigation, SidebarItem, SidebarGroup, Material-UI Icons
 */

'use client'

import { Box, Drawer, List, Divider, IconButton } from '@mui/material'
import {
  Dashboard as DashboardIcon,
  AccountBalance as MovimentacoesIcon,
  Business as GestaoIcon,
  TrackChanges as MetasIcon,
  Assessment as RelatoriosIcon,
  TrendingUp as InvestimentosIcon,
  Category as CadastrosIcon,
  Build as FerramentasIcon,
  ChevronLeft,
  ChevronRight,
  Receipt as ExtratoIcon,
  CreditCard as CartaoIcon,
  BarChart as DREIcon,
  ShowChart as DFCIcon,
  AccountBalanceWallet as BalancoIcon,
  Label as CategoriaIcon,
  Store as CentrosIcon,
  AccountBox as ContasIcon,
  Payment as FormasPagIcon,
  FolderOpen as ProjetosIcon,
  LocalOffer as TagsIcon,
  Description as DocumentosIcon,
  RequestQuote as PropostasIcon,
  Rule as RegrasIcon,
  Upload as ImportacaoIcon,
} from '@mui/icons-material'
import { useNavigation } from '@/hooks/useNavigation'
import { SidebarItem } from './SidebarItem'
import { SidebarGroup } from './SidebarGroup'

const SIDEBAR_WIDTH = 260
const SIDEBAR_MINIMIZED_WIDTH = 64

export function Sidebar() {
  const {
    isRouteActive,
    isGroupCollapsed,
    isSidebarMinimized,
    toggleGroup,
    setSidebarMinimized,
  } = useNavigation()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isSidebarMinimized ? SIDEBAR_MINIMIZED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isSidebarMinimized ? SIDEBAR_MINIMIZED_WIDTH : SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Logo e botao de colapso */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent={isSidebarMinimized ? 'center' : 'space-between'}
        px={2}
        py={1.5}
        sx={{ minHeight: 64 }}
      >
        {!isSidebarMinimized && (
          <Box component="span" fontWeight={700} fontSize={18} color="primary.main">
            Meu Financeiro
          </Box>
        )}
        <IconButton size="small" onClick={() => setSidebarMinimized(!isSidebarMinimized)}>
          {isSidebarMinimized ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      <Divider />

      {/* Navegacao principal — 8 grupos conforme documentos de analise */}
      <List sx={{ pt: 1, pb: 2, overflowY: 'auto', flex: 1 }}>

        {/* 1. Visao Geral */}
        <SidebarItem
          label="Visao Geral"
          href="/dashboard"
          icon={<DashboardIcon fontSize="small" />}
          isActive={isRouteActive('/dashboard')}
          isMinimized={isSidebarMinimized}
        />

        {/* 2. Movimentacoes e Caixa */}
        <SidebarGroup
          label="Movimentacoes e Caixa"
          icon={<MovimentacoesIcon fontSize="small" />}
          isCollapsed={isGroupCollapsed('movimentacoes')}
          isMinimized={isSidebarMinimized}
          onToggle={() => toggleGroup('movimentacoes')}
        >
          <SidebarItem
            label="Extrato de Contas"
            href="/movimentacoes/extrato"
            icon={<ExtratoIcon fontSize="small" />}
            isActive={isRouteActive('/movimentacoes/extrato')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Cartoes de Credito"
            href="/movimentacoes/cartoes"
            icon={<CartaoIcon fontSize="small" />}
            isActive={isRouteActive('/movimentacoes/cartoes')}
            isMinimized={isSidebarMinimized}
            isChild
          />
        </SidebarGroup>

        {/* 3. Gestao do Negocio */}
        <SidebarGroup
          label="Gestao do Negocio"
          icon={<GestaoIcon fontSize="small" />}
          isCollapsed={isGroupCollapsed('gestao')}
          isMinimized={isSidebarMinimized}
          onToggle={() => toggleGroup('gestao')}
        >
          <SidebarItem
            label="DRE"
            href="/gestao/dre"
            icon={<DREIcon fontSize="small" />}
            isActive={isRouteActive('/gestao/dre')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="DFC"
            href="/gestao/dfc"
            icon={<DFCIcon fontSize="small" />}
            isActive={isRouteActive('/gestao/dfc')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Balanco Patrimonial"
            href="/gestao/balanco"
            icon={<BalancoIcon fontSize="small" />}
            isActive={isRouteActive('/gestao/balanco')}
            isMinimized={isSidebarMinimized}
            isChild
          />
        </SidebarGroup>

        {/* 4. Metas */}
        <SidebarItem
          label="Metas"
          href="/metas"
          icon={<MetasIcon fontSize="small" />}
          isActive={isRouteActive('/metas')}
          isMinimized={isSidebarMinimized}
        />

        {/* 5. Relatorios */}
        <SidebarItem
          label="Relatorios"
          href="/relatorios"
          icon={<RelatoriosIcon fontSize="small" />}
          isActive={isRouteActive('/relatorios')}
          isMinimized={isSidebarMinimized}
        />

        {/* 6. Investimentos */}
        <SidebarItem
          label="Investimentos"
          href="/investimentos"
          icon={<InvestimentosIcon fontSize="small" />}
          isActive={isRouteActive('/investimentos')}
          isMinimized={isSidebarMinimized}
        />

        <Divider sx={{ my: 1 }} />

        {/* 7. Cadastros */}
        <SidebarGroup
          label="Cadastros"
          icon={<CadastrosIcon fontSize="small" />}
          isCollapsed={isGroupCollapsed('cadastros')}
          isMinimized={isSidebarMinimized}
          onToggle={() => toggleGroup('cadastros')}
        >
          <SidebarItem
            label="Categorias"
            href="/cadastros/categorias"
            icon={<CategoriaIcon fontSize="small" />}
            isActive={isRouteActive('/cadastros/categorias')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Centros de Custo"
            href="/cadastros/centros"
            icon={<CentrosIcon fontSize="small" />}
            isActive={isRouteActive('/cadastros/centros')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Contas"
            href="/cadastros/contas"
            icon={<ContasIcon fontSize="small" />}
            isActive={isRouteActive('/cadastros/contas')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Formas de Pagamento"
            href="/cadastros/formas-pagamento"
            icon={<FormasPagIcon fontSize="small" />}
            isActive={isRouteActive('/cadastros/formas-pagamento')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Projetos"
            href="/cadastros/projetos"
            icon={<ProjetosIcon fontSize="small" />}
            isActive={isRouteActive('/cadastros/projetos')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Tags"
            href="/cadastros/tags"
            icon={<TagsIcon fontSize="small" />}
            isActive={isRouteActive('/cadastros/tags')}
            isMinimized={isSidebarMinimized}
            isChild
          />
        </SidebarGroup>

        {/* 8. Ferramentas */}
        <SidebarGroup
          label="Ferramentas"
          icon={<FerramentasIcon fontSize="small" />}
          isCollapsed={isGroupCollapsed('ferramentas')}
          isMinimized={isSidebarMinimized}
          onToggle={() => toggleGroup('ferramentas')}
        >
          <SidebarItem
            label="Documentos"
            href="/ferramentas/documentos"
            icon={<DocumentosIcon fontSize="small" />}
            isActive={isRouteActive('/ferramentas/documentos')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Propostas Comerciais"
            href="/ferramentas/propostas"
            icon={<PropostasIcon fontSize="small" />}
            isActive={isRouteActive('/ferramentas/propostas')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Regras de Preenchimento"
            href="/ferramentas/regras"
            icon={<RegrasIcon fontSize="small" />}
            isActive={isRouteActive('/ferramentas/regras')}
            isMinimized={isSidebarMinimized}
            isChild
          />
          <SidebarItem
            label="Importacao de Lancamentos"
            href="/ferramentas/importacao"
            icon={<ImportacaoIcon fontSize="small" />}
            isActive={isRouteActive('/ferramentas/importacao')}
            isMinimized={isSidebarMinimized}
            isChild
          />
        </SidebarGroup>
      </List>
    </Drawer>
  )
}
