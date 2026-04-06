/**
 * 📄 Descrição: Serviço de Gestão Empresarial — Centros de Custo, Projetos, Contatos e Tags
 * 🧱 Contexto: Módulo de cadastros complementares para classificação de lançamentos
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: TypeScript, Supabase
 * 🔍 Dependências: @supabase/supabase-js
 * ✅ Revisado: Sim
 */

import { supabase } from '@/lib/supabase'

// ─── CENTROS DE CUSTO ────────────────────────────────────────────────

export interface CostCenter {
  id: string
  userId: string
  name: string
  description?: string
  code?: string
  isActive: boolean
  createdAt: string
}

export class CostCenterService {
  async list(userId: string): Promise<CostCenter[]> {
    const { data, error } = await supabase
      .from('cost_centers').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return (data || []).map(this.map)
  }

  async create(userId: string, input: { name: string; description?: string; code?: string }): Promise<CostCenter> {
    const { data, error } = await supabase
      .from('cost_centers').insert({ user_id: userId, ...input }).select().single()
    if (error) throw error
    return this.map(data)
  }

  async update(userId: string, id: string, input: Partial<{ name: string; description: string; code: string; isActive: boolean }>): Promise<CostCenter> {
    const { data, error } = await supabase
      .from('cost_centers')
      .update({ name: input.name, description: input.description, code: input.code, is_active: input.isActive, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', userId).select().single()
    if (error) throw error
    if (!data) throw new Error('Centro de custo não encontrado')
    return this.map(data)
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('cost_centers').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  }

  private map(d: any): CostCenter {
    return { id: d.id, userId: d.user_id, name: d.name, description: d.description, code: d.code, isActive: d.is_active ?? true, createdAt: d.created_at }
  }
}

// ─── PROJETOS ────────────────────────────────────────────────────────

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  status: 'ATIVO' | 'CONCLUIDO' | 'CANCELADO'
  startDate?: string
  endDate?: string
  budget?: number
  createdAt: string
}

export class ProjectService {
  async list(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return (data || []).map(this.map)
  }

  async create(userId: string, input: { name: string; description?: string; status?: string; startDate?: string; endDate?: string; budget?: number }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects').insert({
        user_id: userId, name: input.name, description: input.description,
        status: input.status || 'ATIVO',
        start_date: input.startDate, end_date: input.endDate,
        budget: input.budget,
      }).select().single()
    if (error) throw error
    return this.map(data)
  }

  async update(userId: string, id: string, input: Partial<{ name: string; description: string; status: string; startDate: string; endDate: string; budget: number }>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects').update({
        name: input.name, description: input.description, status: input.status,
        start_date: input.startDate, end_date: input.endDate, budget: input.budget,
        updated_at: new Date().toISOString(),
      }).eq('id', id).eq('user_id', userId).select().single()
    if (error) throw error
    if (!data) throw new Error('Projeto não encontrado')
    return this.map(data)
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  }

  private map(d: any): Project {
    return {
      id: d.id, userId: d.user_id, name: d.name, description: d.description,
      status: d.status || 'ATIVO', startDate: d.start_date, endDate: d.end_date,
      budget: d.budget, createdAt: d.created_at,
    }
  }
}

// ─── CONTATOS ────────────────────────────────────────────────────────

export interface Contact {
  id: string
  userId: string
  name: string
  type: 'CLIENTE' | 'FORNECEDOR' | 'AMBOS'
  email?: string
  phone?: string
  document?: string
  isActive: boolean
  createdAt: string
}

export class ContactService {
  async list(userId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return (data || []).map(this.map)
  }

  async create(userId: string, input: { name: string; type: string; email?: string; phone?: string; document?: string }): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts').insert({ user_id: userId, ...input }).select().single()
    if (error) throw error
    return this.map(data)
  }

  async update(userId: string, id: string, input: Partial<{ name: string; type: string; email: string; phone: string; document: string; isActive: boolean }>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts').update({ ...input, is_active: input.isActive, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', userId).select().single()
    if (error) throw error
    if (!data) throw new Error('Contato não encontrado')
    return this.map(data)
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('contacts').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  }

  private map(d: any): Contact {
    return { id: d.id, userId: d.user_id, name: d.name, type: d.type || 'AMBOS', email: d.email, phone: d.phone, document: d.document, isActive: d.is_active ?? true, createdAt: d.created_at }
  }
}

// ─── TAGS ─────────────────────────────────────────────────────────────

export interface Tag {
  id: string
  userId: string
  name: string
  color?: string
  createdAt: string
}

export class TagService {
  async list(userId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return (data || []).map(this.map)
  }

  async create(userId: string, input: { name: string; color?: string }): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags').insert({ user_id: userId, ...input }).select().single()
    if (error) throw error
    return this.map(data)
  }

  async update(userId: string, id: string, input: Partial<{ name: string; color: string }>): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags').update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', userId).select().single()
    if (error) throw error
    if (!data) throw new Error('Tag não encontrada')
    return this.map(data)
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('tags').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  }

  private map(d: any): Tag {
    return { id: d.id, userId: d.user_id, name: d.name, color: d.color, createdAt: d.created_at }
  }
}
