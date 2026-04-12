export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meu Financeiro',
  description: 'Sistema de gestão financeira pessoal e empresarial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
