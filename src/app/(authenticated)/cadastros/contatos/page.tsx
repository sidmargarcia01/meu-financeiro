/**
 * CAMADA: UI
 * MÓDULO: Cadastros - Contatos
 * RESPONSABELIDADE: Página de gestão de contatos (CRUD)
 * NÃO DEVE: Conter lógica de negócio ou acesso direto à API
 * DEPENDE DE: hooks useContacts, Material-UI, React
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
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material'
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts'
import type { CreateContactInput, UpdateContactInput } from '@/schemas/contactSchema'
import type { Contact } from '@/hooks/useContacts'

interface ContactFormData {
  name: string
  email?: string | null
  phone?: string | null
}

export default function ContatosPage() {
  const { data: contacts, error, isLoading } = useContacts()
  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()
  const deleteMutation = useDeleteContact()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: ''
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '' })
    setEditingContact(null)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    if (editingContact) {
      updateMutation.mutate(
        { id: editingContact.id, data: formData },
        {
          onSuccess: () => {
            setDialogOpen(false)
            resetForm()
            setSnackbar({ open: true, message: 'Contato atualizado com sucesso', severity: 'success' })
          },
          onError: (error: any) => {
            setSnackbar({ open: true, message: error.message, severity: 'error' })
          }
        }
      )
    } else {
      createMutation.mutate(formData as CreateContactInput, {
        onSuccess: () => {
          setDialogOpen(false)
          resetForm()
          setSnackbar({ open: true, message: 'Contato criado com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setSnackbar({ open: true, message: 'Contato excluído com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  if (isLoading) return <Typography>Carregando...</Typography>
  if (error) return <Typography color="error">Erro ao carregar contatos</Typography>

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Contatos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
        >
          Novo Contato
        </Button>
      </Box>

      <List>
        {contacts?.map(contact => (
          <ListItem key={contact.id}>
            <ListItemText
              primary={
                <Box>
                  <Typography variant="body1">{contact.name}</Typography>
                  <Box display="flex" gap={2} mt={0.5}>
                    {contact.email && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {contact.email}
                        </Typography>
                      </Box>
                    )}
                    {contact.phone && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {contact.phone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              }
            />
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton size="small" onClick={() => handleEdit(contact)}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(contact.id, contact.name)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingContact ? 'Editar Contato' : 'Novo Contato'}
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
              label="Email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
              type="email"
              fullWidth
            />
            <TextField
              label="Telefone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
              placeholder="(11) 99999-9999"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingContact ? 'Atualizar' : 'Criar'}
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
