'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error.message, error.stack)
  }, [error])

  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <h2 style={{ color: 'red' }}>Erro no Dashboard</h2>
      <pre style={{ background: '#fee', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      {error.digest && <p>Digest: {error.digest}</p>}
      <button onClick={reset} style={{ marginTop: 16, padding: '8px 16px' }}>
        Tentar novamente
      </button>
    </div>
  )
}
