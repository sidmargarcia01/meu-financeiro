/**
 * CAMADA: Test - Service
 * MÓDULO: Cadastros - Contatos
 * RESPONSABILIDADE: Testar regras de negócio de contatos
 * NÃO DEVE: Testar componentes React ou API routes
 */

import { contactService } from '@/services/contactService'
import { contactRepository } from '@/repositories/contactRepository'

jest.mock('@/repositories/contactRepository')

describe('contactService', () => {
  beforeEach(() => jest.clearAllMocks())

  // CREATE
  describe('create', () => {
    it('deve criar contato com dados válidos', async () => {
      ;(contactRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(contactRepository.create as jest.Mock).mockResolvedValue({
        id: 'contact-1', name: 'João Silva', email: 'joao@email.com', phone: '11999999999', user_id: 'user-1'
      })

      const result = await contactService.create('user-1', {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999'
      })

      expect(result.name).toBe('João Silva')
      expect(result.email).toBe('joao@email.com')
      expect(result.phone).toBe('11999999999')
    })

    it('deve rejeitar nome duplicado no mesmo usuário', async () => {
      ;(contactRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'contact-existente', name: 'João Silva'
      })

      await expect(
        contactService.create('user-1', { name: 'João Silva', email: 'novo@email.com' })
      ).rejects.toThrow('Já existe um contato com este nome')
    })

    it('deve rejeitar nome vazio', async () => {
      await expect(
        contactService.create('user-1', { name: '', email: 'teste@email.com' })
      ).rejects.toThrow('Nome é obrigatório')
    })

    it('deve rejeitar nome muito longo', async () => {
      await expect(
        contactService.create('user-1', { name: 'a'.repeat(101), email: 'teste@email.com' })
      ).rejects.toThrow('Nome deve ter no máximo 100 caracteres')
    })

    it('deve rejeitar email inválido', async () => {
      await expect(
        contactService.create('user-1', { name: 'Teste', email: 'email-invalido' })
      ).rejects.toThrow('Email inválido')
    })

    it('deve aceitar contato sem email e telefone', async () => {
      ;(contactRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(contactRepository.create as jest.Mock).mockResolvedValue({
        id: 'contact-1', name: 'Contato Simples', user_id: 'user-1'
      })

      const result = await contactService.create('user-1', {
        name: 'Contato Simples'
      })

      expect(result.name).toBe('Contato Simples')
    })
  })

  // GET ALL
  describe('getAll', () => {
    it('deve retornar contatos do usuário', async () => {
      ;(contactRepository.findAllByUser as jest.Mock).mockResolvedValue([
        { id: 'contact-1', name: 'João Silva', email: 'joao@email.com', phone: '11999999999', user_id: 'user-1' },
        { id: 'contact-2', name: 'Maria Santos', email: 'maria@email.com', phone: '11888888888', user_id: 'user-1' }
      ])

      const result = await contactService.getAll('user-1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('João Silva')
    })

    it('não deve retornar contatos de outro usuário', async () => {
      ;(contactRepository.findAllByUser as jest.Mock).mockResolvedValue([])

      await contactService.getAll('user-correto')

      expect(contactRepository.findAllByUser).toHaveBeenCalledWith('user-correto')
    })
  })

  // UPDATE
  describe('update', () => {
    it('deve atualizar contato com dados válidos', async () => {
      ;(contactRepository.findById as jest.Mock).mockResolvedValue({
        id: 'contact-1', name: 'João Silva', email: 'joao@email.com', phone: '11999999999', user_id: 'user-1'
      })
      ;(contactRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(contactRepository.update as jest.Mock).mockResolvedValue({
        id: 'contact-1', name: 'João Silva Atualizado', email: 'novo@email.com', phone: '11777777777', user_id: 'user-1'
      })

      const result = await contactService.update('contact-1', 'user-1', {
        name: 'João Silva Atualizado',
        email: 'novo@email.com',
        phone: '11777777777'
      })

      expect(result.name).toBe('João Silva Atualizado')
    })

    it('deve rejeitar atualização de contato não encontrado', async () => {
      ;(contactRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        contactService.update('contact-inexistente', 'user-1', { name: 'Novo' })
      ).rejects.toThrow('Contato não encontrado')
    })

    it('deve rejeitar nome duplicado na atualização', async () => {
      ;(contactRepository.findById as jest.Mock).mockResolvedValue({
        id: 'contact-1', name: 'João Silva', email: 'joao@email.com', phone: '11999999999', user_id: 'user-1'
      })
      ;(contactRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'contact-2', name: 'Maria Santos' // Nome já existe
      })

      await expect(
        contactService.update('contact-1', 'user-1', { name: 'Maria Santos' })
      ).rejects.toThrow('Já existe um contato com este nome')
    })

    it('deve rejeitar email inválido na atualização', async () => {
      ;(contactRepository.findById as jest.Mock).mockResolvedValue({
        id: 'contact-1', name: 'João Silva', email: 'joao@email.com', phone: '11999999999', user_id: 'user-1'
      })

      await expect(
        contactService.update('contact-1', 'user-1', { email: 'email-invalido' })
      ).rejects.toThrow('Email inválido')
    })
  })

  // DELETE
  describe('delete', () => {
    it('deve excluir contato sem lançamentos vinculados', async () => {
      ;(contactRepository.findById as jest.Mock).mockResolvedValue({
        id: 'contact-1', name: 'João Silva', user_id: 'user-1'
      })
      ;(contactRepository.hasTransactions as jest.Mock).mockResolvedValue(false)
      ;(contactRepository.delete as jest.Mock).mockResolvedValue(true)

      await expect(
        contactService.delete('contact-1', 'user-1')
      ).resolves.not.toThrow()
    })

    it('deve rejeitar exclusão com lançamentos vinculados', async () => {
      ;(contactRepository.findById as jest.Mock).mockResolvedValue({
        id: 'contact-1', name: 'João Silva', user_id: 'user-1'
      })
      ;(contactRepository.hasTransactions as jest.Mock).mockResolvedValue(true)

      await expect(
        contactService.delete('contact-1', 'user-1')
      ).rejects.toThrow('Não é possível excluir contato com lançamentos vinculados')
    })

    it('deve rejeitar exclusão de contato de outro usuário', async () => {
      ;(contactRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        contactService.delete('contact-1', 'user-correto')
      ).rejects.toThrow('Contato não encontrado')
    })
  })
})
