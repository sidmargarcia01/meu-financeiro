'use client'

import dynamic from 'next/dynamic'
import { Loading } from '@/components/Loading'

const DashboardClient = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => <Loading message="Carregando dashboard..." fullScreen />
})

export default function DashboardPage() {
  return <DashboardClient />
}
