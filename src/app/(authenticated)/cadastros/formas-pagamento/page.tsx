/**
 * CAMADA: UI
 * MÓDULO: Cadastros - Formas de Pagamento
 * RESPONSABELIDADE: Página de gestão de formas de pagamento (CRUD)
 * NÃO DEVE: Conter lógica de negócio ou acesso direto à API
 * DEPENDE DE: hooks usePaymentMethods, Material-UI, React
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from '@/hooks/usePaymentMethods'
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from '@/schemas/paymentMethodSchema'
import type { PaymentMethod } from '@/hooks/usePaymentMethods'

interface PaymentMethodFormData {
  name: string
  type: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'PIX' | 'OTHER'
}

const paymentTypeLabels = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  BANK_TRANSFER: 'Transferência Bancária',
  PIX: 'PIX',
  OTHER: 'Outro'
}

const paymentTypeColors = {
  CASH: '#4CAF50',
  CREDIT_CARD: '#2196F3',
  DEBIT_CARD: '#FF9800',
  BANK_TRANSFER: '#9C27B0',
  PIX: '#00BCD4',
  OTHER: '#757575'
}

export default function FormasPagamentoPage() {
  const { data: paymentMethods, error, isLoading } = usePaymentMethods()
  const createMutation = useCreatePaymentMethod()
  const updateMutation = useUpdatePaymentMethod()
  const deleteMutation = useDeletePaymentMethod()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    type: 'CASH'
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const resetForm = () => {
    setFormData({ name: '', type: 'CASH' })
    setEditingPaymentMethod(null)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    if (editingPaymentMethod) {
      updateMutation.mutate(
        { id: editingPaymentMethod.id, data: formData },
        {
          onSuccess: () => {
            setDialogOpen(false)
            resetForm()
            setSnackbar({ open: true, message: 'Forma de pagamento atualizada com sucesso', severity: 'success' })
          },
          onError: (error: any) => {
            setSnackbar({ open: true, message: error.message, severity: 'error' })
          }
        }
      )
    } else {
      createMutation.mutate(formData as CreatePaymentMethodInput, {
        onSuccess: () => {
          setDialogOpen(false)
          resetForm()
          setSnackbar({ open: true, message: 'Forma de pagamento criada com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod)
    setFormData({
      name: paymentMethod.name,
      type: paymentMethod.type
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setSnackbar({ open: true, message: 'Forma de pagamento excluída com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  if (isLoading) return <Typography>Carregando...</Typography>
  if (error) return <Typography color="error">Erro ao carregar formas de pagamento</Typography>

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Formas de Pagamento</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
        >
          Nova Forma de Pagamento
        </Button>
      </Box>

      <List>
        {paymentMethods?.map(paymentMethod => (
          <ListItem key={paymentMethod.id}>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body1">{paymentMethod.name}</Typography>
                  <Chip
                    label={paymentTypeLabels[paymentMethod.type]}
                    size="small"
                    style={{
                      backgroundColor: paymentTypeColors[paymentMethod.type],
                      color: '#fff'
                    }}
                  />
                </Box>
              }
            />
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton size="small" onClick={() => handleEdit(paymentMethod)}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(paymentMethod.id, paymentMethod.name)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPaymentMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethodFormData['type'] })}
              >
                {Object.entries(paymentTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPaymentMethod ? 'Atualizar' : 'Criar'}
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
