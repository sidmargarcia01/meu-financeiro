/**
 * 📄 Descrição: Alternar modo claro/escuro — documentado no rodapé do menu
 * 🧱 Contexto: Utilizado pelo SidebarFooter
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, localStorage
 * 🔍 Dependências: nenhuma externa
 * ✅ Revisado: Sim
 *
 * CAMADA: Hook
 * MÓDULO: Theme
 * RESPONSABILIDADE: Alternar modo claro/escuro conforme documentado no rodapé
 * NÃO DEVE: Acessar APIs, conter lógica de negócio
 * DEPENDE DE: localStorage
 */

'use client'

import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('mf_theme')
    if (stored === 'dark') setIsDark(true)
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('mf_theme', next ? 'dark' : 'light')
  }

  return { isDark, toggleTheme }
}
