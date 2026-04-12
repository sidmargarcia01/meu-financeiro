/**
 * CAMADA: UI
 * MÓDULO: Cadastros - Categorias
 * RESPONSABELIDADE: Página de gestão de categorias (CRUD)
 * NÃO DEVE: Conter lógica de negócio ou acesso direto à API
 * DEPENDE DE: hooks useCategories, Material-UI, React
 */

'use client'

export const dynamic = 'force-dynamic'

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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Delete as DeleteIcon,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories'
import type { CreateCategoryInput, UpdateCategoryInput } from '@/schemas/categorySchema'
import type { CategoryWithChildren } from '@/services/categoryService'

interface CategoryFormData {
  name: string
  type: 'RECEITA' | 'DESPESA'
  parent_id?: string | null
}

export default function CategoriasPage() {
  const { data: categories, error, isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'DESPESA',
    parent_id: null
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const resetForm = () => {
    setFormData({ name: '', type: 'DESPESA', parent_id: null })
    setEditingCategory(null)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    if (editingCategory) {
      updateMutation.mutate(
        { id: editingCategory.id, data: { name: formData.name } },
        {
          onSuccess: () => {
            setDialogOpen(false)
            resetForm()
            setSnackbar({ open: true, message: 'Categoria atualizada com sucesso', severity: 'success' })
          },
          onError: (error: any) => {
            setSnackbar({ open: true, message: error.message, severity: 'error' })
          }
        }
      )
    } else {
      createMutation.mutate(formData as CreateCategoryInput, {
        onSuccess: () => {
          setDialogOpen(false)
          resetForm()
          setSnackbar({ open: true, message: 'Categoria criada com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  const handleEdit = (category: CategoryWithChildren) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      parent_id: category.parent_id
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setSnackbar({ open: true, message: 'Categoria excluída com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const renderCategory = (category: CategoryWithChildren, level = 0) => {
    const hasChildren = category.children.length > 0
    const isExpanded = expanded.has(category.id)

    return (
      <Box key={category.id}>
        <ListItem sx={{ pl: level * 3 }}>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1">{category.name}</Typography>
                <Chip
                  label={category.type}
                  size="small"
                  color={category.type === 'RECEITA' ? 'success' : 'error'}
                />
              </Box>
            }
          />
          <Box display="flex" alignItems="center" gap={1}>
            {hasChildren && (
              <IconButton size="small" onClick={() => toggleExpand(category.id)}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
            <IconButton size="small" onClick={() => handleEdit(category)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => handleDelete(category.id, category.name)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </ListItem>
        {hasChildren && isExpanded && (
          <List disablePadding>
            {category.children.map(child => renderCategory(child, level + 1))}
          </List>
        )}
      </Box>
    )
  }

  if (isLoading) return <Typography>Carregando...</Typography>
  if (error) return <Typography color="error">Erro ao carregar categorias</Typography>

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Categorias</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
        >
          Nova Categoria
        </Button>
      </Box>

      <List>
        {categories?.map(category => renderCategory(category))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                label="Tipo"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'RECEITA' | 'DESPESA' })}
                disabled={!!editingCategory}
              >
                <MenuItem value="RECEITA">Receita</MenuItem>
                <MenuItem value="DESPESA">Despesa</MenuItem>
              </Select>
            </FormControl>
            {!editingCategory && (
              <FormControl fullWidth>
                <InputLabel>Categoria Pai</InputLabel>
                <Select
                  value={formData.parent_id || ''}
                  label="Categoria Pai"
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                >
                  <MenuItem value="">Nenhuma</MenuItem>
                  {categories?.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCategory ? 'Atualizar' : 'Criar'}
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
