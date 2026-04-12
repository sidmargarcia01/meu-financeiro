/**
 * CAMADA: UI
 * MÓDULO: Cadastros - Centros de Custo
 * RESPONSABELIDADE: Página de gestão de centros de custo (CRUD)
 * NÃO DEVE: Conter lógica de negócio ou acesso direto à API
 * DEPENDE DE: hooks useCostCenters, Material-UI, React
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
  Alert,
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { useCostCenters, useCreateCostCenter, useUpdateCostCenter, useDeleteCostCenter } from '@/hooks/useCostCenters'
import type { CreateCostCenterInput, UpdateCostCenterInput } from '@/schemas/costCenterSchema'
import type { CostCenter } from '@/hooks/useCostCenters'

interface CostCenterFormData {
  name: string
  description?: string
}

export default function CentrosPage() {
  const { data: costCenters, error, isLoading } = useCostCenters()
  const createMutation = useCreateCostCenter()
  const updateMutation = useUpdateCostCenter()
  const deleteMutation = useDeleteCostCenter()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null)
  const [formData, setFormData] = useState<CostCenterFormData>({
    name: '',
    description: ''
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setEditingCostCenter(null)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    if (editingCostCenter) {
      updateMutation.mutate(
        { id: editingCostCenter.id, data: formData },
        {
          onSuccess: () => {
            setDialogOpen(false)
            resetForm()
            setSnackbar({ open: true, message: 'Centro de custo atualizado com sucesso', severity: 'success' })
          },
          onError: (error: any) => {
            setSnackbar({ open: true, message: error.message, severity: 'error' })
          }
        }
      )
    } else {
      createMutation.mutate(formData as CreateCostCenterInput, {
        onSuccess: () => {
          setDialogOpen(false)
          resetForm()
          setSnackbar({ open: true, message: 'Centro de custo criado com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter)
    setFormData({
      name: costCenter.name,
      description: costCenter.description || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setSnackbar({ open: true, message: 'Centro de custo excluído com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  if (isLoading) return <Typography>Carregando...</Typography>
  if (error) return <Typography color="error">Erro ao carregar centros de custo</Typography>

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Centros de Custo</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
        >
          Novo Centro de Custo
        </Button>
      </Box>

      <List>
        {costCenters?.map(costCenter => (
          <ListItem key={costCenter.id}>
            <ListItemText
              primary={
                <Box>
                  <Typography variant="body1">{costCenter.name}</Typography>
                  {costCenter.description && (
                    <Typography variant="body2" color="textSecondary">
                      {costCenter.description}
                    </Typography>
                  )}
                </Box>
              }
            />
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton size="small" onClick={() => handleEdit(costCenter)}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(costCenter.id, costCenter.name)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
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
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCostCenter ? 'Atualizar' : 'Criar'}
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
