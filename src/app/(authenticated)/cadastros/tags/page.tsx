/**
 * CAMADA: UI
 * MÓDULO: Cadastros - Tags
 * RESPONSABELIDADE: Página de gestão de tags (CRUD)
 * NÃO DEVE: Conter lógica de negócio ou acesso direto à API
 * DEPENDE DE: hooks useTags, Material-UI, React
 */

'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Alert,
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags'
import type { CreateTagInput, UpdateTagInput } from '@/schemas/tagSchema'
import type { Tag } from '@/hooks/useTags'

interface TagFormData {
  name: string
  color?: string | null
}

export default function TagsPage() {
  const { data: tags, error, isLoading } = useTags()
  const createMutation = useCreateTag()
  const updateTagMutation = useUpdateTag
  const deleteTagMutation = useDeleteTag

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    color: '#FF0000'
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const resetForm = () => {
    setFormData({ name: '', color: '#FF0000' })
    setEditingTag(null)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    if (editingTag) {
      updateTagMutation(editingTag.id).mutate(
        formData,
        {
          onSuccess: () => {
            setDialogOpen(false)
            resetForm()
            setSnackbar({ open: true, message: 'Tag atualizada com sucesso', severity: 'success' })
          },
          onError: (error: any) => {
            setSnackbar({ open: true, message: error.message, severity: 'error' })
          }
        }
      )
    } else {
      createMutation.mutate(formData as CreateTagInput, {
        onSuccess: () => {
          setDialogOpen(false)
          resetForm()
          setSnackbar({ open: true, message: 'Tag criada com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color || '#FF0000'
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteTagMutation(id).mutate(undefined, {
        onSuccess: () => {
          setSnackbar({ open: true, message: 'Tag excluída com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  if (isLoading) return <Typography>Carregando...</Typography>
  if (error) return <Typography color="error">Erro ao carregar tags</Typography>

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tags</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
        >
          Nova Tag
        </Button>
      </Box>

      <List>
        {tags?.map(tag => (
          <ListItem key={tag.id}>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body1">{tag.name}</Typography>
                  {tag.color && (
                    <Chip
                      label={tag.color}
                      size="small"
                      style={{ backgroundColor: tag.color, color: '#fff' }}
                    />
                  )}
                </Box>
              }
            />
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton size="small" onClick={() => handleEdit(tag)}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(tag.id, tag.name)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTag ? 'Editar Tag' : 'Nova Tag'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Cor (hex)"
              value={formData.color || ''}
              onChange={(e) => setFormData({ ...formData, color: e.target.value || null })}
              placeholder="#FF0000"
              fullWidth
              helperText="Código de cor hexadecimal (ex: #FF0000)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTag ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
