/**
 * CAMADA: Components
 * MÓDULO: Sidebar
 * RESPONSABILIDADE: Navegação lateral principal
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: React, Next.js, Lucide Icons
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  Target, 
  PieChart, 
  Settings, 
  Upload,
  Menu,
  X,
  Wallet,
  Calculator,
  Users,
  FolderOpen,
  Tag,
  Building,
  ArrowRight
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    label: 'Visão Geral',
    href: '/dashboard',
    icon: <Home className="h-4 w-4" />
  },
  {
    label: 'Movimentações e Caixa',
    href: '/transactions',
    icon: <Wallet className="h-4 w-4" />,
    children: [
      {
        label: 'Extrato de Contas',
        href: '/transactions/accounts',
        icon: <CreditCard className="h-4 w-4" />
      },
      {
        label: 'Cartões de Crédito',
        href: '/transactions/credit-cards',
        icon: <CreditCard className="h-4 w-4" />
      }
    ]
  },
  {
    label: 'Gestão do Negócio',
    href: '/business',
    icon: <Building className="h-4 w-4" />,
    children: [
      {
        label: 'DRE',
        href: '/business/dre',
        icon: <FileText className="h-4 w-4" />
      },
      {
        label: 'DFC',
        href: '/business/dfc',
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        label: 'Balanço Patrimonial',
        href: '/business/balance',
        icon: <Calculator className="h-4 w-4" />
      }
    ]
  },
  {
    label: 'Metas',
    href: '/goals',
    icon: <Target className="h-4 w-4" />
  },
  {
    label: 'Relatórios',
    href: '/reports',
    icon: <PieChart className="h-4 w-4" />
  },
  {
    label: 'Investimentos',
    href: '/investments',
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    label: 'Cadastros',
    href: '/registers',
    icon: <FolderOpen className="h-4 w-4" />,
    children: [
      {
        label: 'Categorias',
        href: '/registers/categories',
        icon: <Tag className="h-4 w-4" />
      },
      {
        label: 'Contas',
        href: '/registers/accounts',
        icon: <CreditCard className="h-4 w-4" />
      },
      {
        label: 'Centros de Custo',
        href: '/registers/cost-centers',
        icon: <Calculator className="h-4 w-4" />
      },
      {
        label: 'Projetos',
        href: '/registers/projects',
        icon: <Target className="h-4 w-4" />
      },
      {
        label: 'Contatos',
        href: '/registers/contacts',
        icon: <Users className="h-4 w-4" />
      },
      {
        label: 'Tags',
        href: '/registers/tags',
        icon: <Tag className="h-4 w-4" />
      }
    ]
  },
  {
    label: 'Ferramentas',
    href: '/tools',
    icon: <Settings className="h-4 w-4" />,
    children: [
      {
        label: 'Importação de Lançamentos',
        href: '/tools/import',
        icon: <Upload className="h-4 w-4" />
      },
      {
        label: 'Regras de Preenchimento',
        href: '/tools/rules',
        icon: <Settings className="h-4 w-4" />
      }
    ]
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className = '' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.label)
    const active = isActive(item.href)

    return (
      <div key={item.href}>
        <Link
          href={item.href}
          className={`
            flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
            ${active 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }
            ${level > 0 ? 'ml-4' : ''}
          `}
          onClick={() => hasChildren && toggleExpanded(item.label)}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          {!isCollapsed && (
            <>
              <span className="ml-3 flex-1">{item.label}</span>
              {hasChildren && (
                <svg
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </>
          )}
        </Link>
        
        {hasChildren && !isCollapsed && isExpanded && (
          <div className="mt-1">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MF</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">Meu Financeiro</span>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map(item => renderNavItem(item))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/settings"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span className="ml-3">Configurações</span>}
          </Link>
        </div>
      </div>
    </div>
  )
}

// Component para mobile (drawer)
export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MF</span>
                </div>
                <span className="ml-2 text-lg font-semibold text-gray-900">Meu Financeiro</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="p-4 space-y-2">
              {navigationItems.map(item => renderNavItemMobile(item, pathname))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function renderNavItemMobile(item: NavItem, pathname: string): JSX.Element {
  const hasChildren = item.children && item.children.length > 0
  const active = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <div key={item.href}>
      <Link
        href={item.href}
        className={`
          flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
          ${active 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span className="ml-3 flex-1">{item.label}</span>
        {hasChildren && (
          <ArrowRight className="h-4 w-4 text-gray-400" />
        )}
      </Link>
    </div>
  )
}
