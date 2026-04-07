/**
 * 📄 Descrição: Modal de busca global ativado por CTRL+K ou ícone de lupa
 * 🧱 Contexto: Renderizado no Header, ativado via useSearch hook
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, Material-UI, Next.js
 * 🔍 Dependências: useSearch, formatCurrency
 * ✅ Revisado: Sim
 *
 * CAMADA: Component
 * MÓDULO: Layout - Search
 * RESPONSABILIDADE: Modal de busca global ativado por CTRL+K ou ícone de lupa
 * NÃO DEVE: Fazer fetch diretamente, calcular resultados
 * DEPENDE DE: useSearch hook, formatCurrency util
 */

'use client'

import {
  Dialog, DialogContent, InputBase, List, ListItem,
  ListItemText, Typography, Box, CircularProgress, Divider
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { useSearch } from '@/hooks/useSearch'
import { formatCurrency } from '@/utils/formatCurrency'
import { useRouter } from 'next/navigation'

export function SearchModal() {
  const { isOpen, setIsOpen, term, setTerm, results, isLoading } = useSearch()
  const router = useRouter()

  const handleSelect = (id: string) => {
    setIsOpen(false)
    setTerm('')
    router.push(`/movimentacoes/lancamentos?id=${id}`)
  }

  return (
    <Dialog
      open={isOpen}
      onClose={() => { setIsOpen(false); setTerm('') }}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, mt: '10vh', verticalAlign: 'top' } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box display="flex" alignItems="center" px={2} py={1.5} gap={1}>
          <SearchIcon color="action" />
          <InputBase
            autoFocus
            fullWidth
            placeholder="Buscar lançamentos..."
            value={term}
            onChange={e => setTerm(e.target.value)}
            sx={{ fontSize: 15 }}
            inputProps={{ 'aria-label': 'buscar lançamentos' }}
          />
          {isLoading && <CircularProgress size={16} />}
        </Box>

        {term.length >= 2 && (
          <>
            <Divider />
            {results.length === 0 && !isLoading ? (
              <Box px={2} py={3} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Nenhum resultado para &quot;{term}&quot;
                </Typography>
              </Box>
            ) : (
              <List dense>
                {results.map((tx: { id: string; description: string; type: string; status: string; amount: number }) => (
                  <ListItem
                    key={tx.id}
                    onClick={() => handleSelect(tx.id)}
                    sx={{ px: 2, py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                  >
                    <ListItemText
                      primary={tx.description}
                      secondary={`${tx.type} · ${tx.status}`}
                      primaryTypographyProps={{ fontSize: 14 }}
                      secondaryTypographyProps={{ fontSize: 12 }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={tx.type === 'RECEITA' ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(tx.amount)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}

        <Divider />
        <Box px={2} py={1} bgcolor="grey.50">
          <Typography variant="caption" color="text.disabled">
            CTRL+K para abrir · ESC para fechar
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
