'use client'
import { useState, useEffect, useRef, useCallback, type SetStateAction } from 'react'

export function useSavedCollection<T>(name: string) {
  const [items, setItems] = useState<T[]>([])
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = useRef({ items: [] as T[], version: 0, ready: false, saving: false })
  useEffect(() => {
    const controller = new AbortController()
    current.current.ready = false
    setReady(false)
    fetch(`/api/collections/${name}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Não foi possível carregar os dados salvos.')
      const data = await response.json()
      current.current = { items: data.items, version: data.version, ready: true, saving: false }
      setItems(data.items); setReady(true)
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message) })
    return () => controller.abort()
  }, [name])
  const save = useCallback(async (action: SetStateAction<T[]>) => {
    const previous = current.current
    if (!previous.ready || previous.saving) return false
    const next = typeof action === 'function' ? action(previous.items) : action
    previous.saving = true; setSaving(true); setError(null)
    try {
      const response = await fetch(`/api/collections/${name}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: next, version: previous.version }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao salvar')
      current.current = { items: next, version: result.version, ready: true, saving: false }
      setItems(next)
      return true
    } catch (e: any) { setError(e.message); return false }
    finally { current.current.saving = false; setSaving(false) }
  }, [name])
  return [items, save, { ready, saving, error }] as const
}
