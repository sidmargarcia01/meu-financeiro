/**
 * CAMADA: Components
 * MÓDULO: Layout
 * RESPONSABILIDADE: Layout principal da aplicação
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: React, Next.js, Sidebar
 */

'use client'

import { ReactNode } from 'react'
import { Sidebar, MobileSidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block">
        <Sidebar className="h-screen" />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <MobileSidebar />
          
          {/* Header content can be added here */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Header actions */}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
