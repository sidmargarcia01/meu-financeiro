/**
 * CAMADA: Test - Service
 * MÓDULO: Cadastros - Projetos
 * RESPONSABILIDADE: Testar regras de negócio de projetos
 * NÃO DEVE: Testar componentes React ou API routes
 */

import { projectService } from '@/services/projectService'
import { projectRepository } from '@/repositories/projectRepository'

jest.mock('@/repositories/projectRepository')

describe('projectService', () => {
  beforeEach(() => jest.clearAllMocks())

  // CREATE
  describe('create', () => {
    it('deve criar projeto com dados válidos', async () => {
      ;(projectRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(projectRepository.create as jest.Mock).mockResolvedValue({
        id: 'project-1', name: 'Site Novo', description: 'Desenvolvimento do site', user_id: 'user-1'
      })

      const result = await projectService.create('user-1', {
        name: 'Site Novo',
        description: 'Desenvolvimento do site'
      })

      expect(result.name).toBe('Site Novo')
      expect(result.description).toBe('Desenvolvimento do site')
    })

    it('deve rejeitar nome duplicado no mesmo usuário', async () => {
      ;(projectRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'project-existente', name: 'Site Novo'
      })

      await expect(
        projectService.create('user-1', { name: 'Site Novo', description: 'Duplicado' })
      ).rejects.toThrow('Já existe um projeto com este nome')
    })

    it('deve rejeitar nome vazio', async () => {
      await expect(
        projectService.create('user-1', { name: '', description: 'Inválido' })
      ).rejects.toThrow('Nome é obrigatório')
    })

    it('deve rejeitar nome muito longo', async () => {
      await expect(
        projectService.create('user-1', { name: 'a'.repeat(101), description: 'Inválido' })
      ).rejects.toThrow('Nome deve ter no máximo 100 caracteres')
    })
  })

  // GET ALL
  describe('getAll', () => {
    it('deve retornar projetos do usuário', async () => {
      ;(projectRepository.findAllByUser as jest.Mock).mockResolvedValue([
        { id: 'project-1', name: 'Site Novo', description: 'Site', user_id: 'user-1' },
        { id: 'project-2', name: 'App Mobile', description: 'App', user_id: 'user-1' }
      ])

      const result = await projectService.getAll('user-1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Site Novo')
    })

    it('não deve retornar projetos de outro usuário', async () => {
      ;(projectRepository.findAllByUser as jest.Mock).mockResolvedValue([])

      await projectService.getAll('user-correto')

      expect(projectRepository.findAllByUser).toHaveBeenCalledWith('user-correto')
    })
  })

  // UPDATE
  describe('update', () => {
    it('deve atualizar projeto com dados válidos', async () => {
      ;(projectRepository.findById as jest.Mock).mockResolvedValue({
        id: 'project-1', name: 'Site Novo', description: 'Antigo', user_id: 'user-1'
      })
      ;(projectRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(projectRepository.update as jest.Mock).mockResolvedValue({
        id: 'project-1', name: 'Site Atualizado', description: 'Novo', user_id: 'user-1'
      })

      const result = await projectService.update('project-1', 'user-1', {
        name: 'Site Atualizado',
        description: 'Novo'
      })

      expect(result.name).toBe('Site Atualizado')
    })

    it('deve rejeitar atualização de projeto não encontrado', async () => {
      ;(projectRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        projectService.update('project-inexistente', 'user-1', { name: 'Novo' })
      ).rejects.toThrow('Projeto não encontrado')
    })

    it('deve rejeitar nome duplicado na atualização', async () => {
      ;(projectRepository.findById as jest.Mock).mockResolvedValue({
        id: 'project-1', name: 'Site Novo', description: 'Original', user_id: 'user-1'
      })
      ;(projectRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'project-2', name: 'App Mobile' // Nome já existe
      })

      await expect(
        projectService.update('project-1', 'user-1', { name: 'App Mobile' })
      ).rejects.toThrow('Já existe um projeto com este nome')
    })
  })

  // DELETE
  describe('delete', () => {
    it('deve excluir projeto sem lançamentos vinculados', async () => {
      ;(projectRepository.findById as jest.Mock).mockResolvedValue({
        id: 'project-1', name: 'Site Novo', user_id: 'user-1'
      })
      ;(projectRepository.hasTransactions as jest.Mock).mockResolvedValue(false)
      ;(projectRepository.delete as jest.Mock).mockResolvedValue(true)

      await expect(
        projectService.delete('project-1', 'user-1')
      ).resolves.not.toThrow()
    })

    it('deve rejeitar exclusão com lançamentos vinculados', async () => {
      ;(projectRepository.findById as jest.Mock).mockResolvedValue({
        id: 'project-1', name: 'Site Novo', user_id: 'user-1'
      })
      ;(projectRepository.hasTransactions as jest.Mock).mockResolvedValue(true)

      await expect(
        projectService.delete('project-1', 'user-1')
      ).rejects.toThrow('Não é possível excluir projeto com lançamentos vinculados')
    })

    it('deve rejeitar exclusão de projeto de outro usuário', async () => {
      ;(projectRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        projectService.delete('project-1', 'user-correto')
      ).rejects.toThrow('Projeto não encontrado')
    })
  })
})
