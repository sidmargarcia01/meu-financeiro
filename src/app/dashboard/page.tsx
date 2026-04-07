import dynamic from 'next/dynamic'

const DashboardClient = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#666' }}>Carregando dashboard...</p>
    </div>
  )
})

export default function DashboardPage() {
  return <DashboardClient />
}
