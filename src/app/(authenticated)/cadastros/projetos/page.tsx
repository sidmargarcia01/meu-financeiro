/**
 * CAMADA: UI
 * MÓDULO: Cadastros - Projetos
 * RESPONSABELIDADE: Página de gestão de projetos (CRUD)
 * NÃO DEVE: Conter lógica de negócio ou acesso direto à API
 * DEPENDE DE: hooks useProjects, Material-UI, React
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
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import type { CreateProjectInput, UpdateProjectInput } from '@/schemas/projectSchema'
import type { Project } from '@/hooks/useProjects'

interface ProjectFormData {
  name: string
  description?: string
}

export default function ProjetosPage() {
  const { data: projects, error, isLoading } = useProjects()
  const createMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject
  const deleteProjectMutation = useDeleteProject

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: ''
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setEditingProject(null)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    if (editingProject) {
      updateProjectMutation(editingProject.id).mutate(
        formData,
        {
          onSuccess: () => {
            setDialogOpen(false)
            resetForm()
            setSnackbar({ open: true, message: 'Projeto atualizado com sucesso', severity: 'success' })
          },
          onError: (error: any) => {
            setSnackbar({ open: true, message: error.message, severity: 'error' })
          }
        }
      )
    } else {
      createMutation.mutate(formData as CreateProjectInput, {
        onSuccess: () => {
          setDialogOpen(false)
          resetForm()
          setSnackbar({ open: true, message: 'Projeto criado com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteProjectMutation(id).mutate(undefined, {
        onSuccess: () => {
          setSnackbar({ open: true, message: 'Projeto excluído com sucesso', severity: 'success' })
        },
        onError: (error: any) => {
          setSnackbar({ open: true, message: error.message, severity: 'error' })
        }
      })
    }
  }

  if (isLoading) return <Typography>Carregando...</Typography>
  if (error) return <Typography color="error">Erro ao carregar projetos</Typography>

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projetos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
        >
          Novo Projeto
        </Button>
      </Box>

      <List>
        {projects?.map(project => (
          <ListItem key={project.id}>
            <ListItemText
              primary={
                <Box>
                  <Typography variant="body1">{project.name}</Typography>
                  {project.description && (
                    <Typography variant="body2" color="textSecondary">
                      {project.description}
                    </Typography>
                  )}
                </Box>
              }
            />
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton size="small" onClick={() => handleEdit(project)}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(project.id, project.name)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
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
            {editingProject ? 'Atualizar' : 'Criar'}
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
