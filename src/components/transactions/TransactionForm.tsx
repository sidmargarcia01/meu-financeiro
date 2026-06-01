/**
 * 📄 Descrição: Formulário completo de novo lançamento financeiro
 * 🧱 Contexto: Módulo 1 — componente central do sistema
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, React Hook Form, Zod, Material-UI
 * 🔍 Dependências: react-hook-form, @hookform/resolvers/zod, zod, @mui/material
 * ✅ Revisado: Sim
 *
 * CAMADA: Component
 * MÓDULO: Transactions
 * RESPONSABILIDADE: Formulário completo de novo lançamento conforme documentado
 *   Campos obrigatórios: Valor, Data, Categoria, Conta
 *   Campos condicionais: Data de Competência, Centro, Projeto, Contato, Tag
 *   Tipos: Receita, Despesa, Transferência
 *   Repetição: Fixo (indefinido ou por X meses) e Parcelado (N parcelas ou valor da parcela)
 * NÃO DEVE: Conter regras de negócio, chamar APIs diretamente, calcular saldos
 * DEPENDE DE: React Hook Form, Zod, Material-UI
 */

'use client'

import { useForm, Controller } from 'react-hook-form'
import { useState, useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, TextField, Select, MenuItem, FormControl, InputLabel,
  FormHelperText, Button, Divider, Tooltip, IconButton,
  ToggleButtonGroup, ToggleButton, Typography, InputAdornment,
} from '@mui/material'
import {
  ArrowUpward as ReceitaIcon,
  ArrowDownward as DespesaIcon,
  SwapHoriz as TransfIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material'

const transactionSchema = z.object({
  type: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  due_date: z.string().min(1, 'Data é obrigatória'),
  account_id: z.string().min(1, 'Conta é obrigatória'),
  category_id: z.string().optional(),
  destination_account_id: z.string().optional(),
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'CONCILIADO']),
  competence_date: z.string().optional(),
  regime: z.enum(['CAIXA', 'COMPETENCIA']),
  repetition_type: z.enum(['NONE', 'FIXO', 'PARCELADO']),
  installments: z.coerce.number().min(2).optional(),
  installment_amount: z.coerce.number().positive().optional(),
  fixed_months: z.coerce.number().min(1).optional(),
  center_id: z.string().optional(),
  project_id: z.string().optional(),
  contact_id: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

export interface UserSettings {
  enable_competence_date: boolean
  require_cost_center: boolean
  require_project: boolean
  require_contact: boolean
  require_tag: boolean
  require_subcategory: boolean
  installment_default: 'VALOR_PARCELA' | 'VALOR_TOTAL'
}

export interface Account {
  id: string
  name: string
  type: string
}

export interface Category {
  id: string
  name: string
  type: string
  children: Category[]
}

export interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>
  onCancel: () => void
  accounts: Account[]
  categories: Category[]
  settings: UserSettings
  costCenters?: Array<{ id: string; name: string }>
  projects?: Array<{ id: string; name: string }>
  contacts?: Array<{ id: string; name: string }>
  tags?: Array<{ id: string; name: string; color?: string }>
  initialData?: Partial<TransactionFormData>
  isLoading?: boolean
}

export function TransactionForm({
  onSubmit,
  onCancel,
  accounts,
  categories,
  settings,
  costCenters = [],
  projects = [],
  contacts = [],
  initialData,
  isLoading = false,
}: TransactionFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'DESPESA',
      status: 'PENDENTE',
      regime: 'CAIXA',
      repetition_type: 'NONE',
      tags: [] as string[],
      account_id: '',
      category_id: '',
      destination_account_id: '',
      center_id: '',
      project_id: '',
      contact_id: '',
      notes: '',
      ...initialData,
    },
  })

  // Ref para sobrepor o status no submit via botões de ação
  const formRef = useRef<HTMLFormElement>(null)
  const statusOverrideRef = useRef<'CONFIRMADO' | 'CONCILIADO' | null>(null)

  const transactionType = watch('type')
  const repetitionType = watch('repetition_type')
  const centerIdValue = watch('center_id')
  const installmentsValue = watch('installments')
  const amountValue = watch('amount')

  // Preview do valor por parcela (calculado)
  const installmentPreview = (amountValue && installmentsValue && installmentsValue >= 2)
    ? (amountValue / installmentsValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''

  const filteredCategories = categories.filter(c => {
    if (transactionType === 'RECEITA') return c.type === 'RECEITA'
    if (transactionType === 'DESPESA') return c.type === 'DESPESA'
    return false
  })

  // Estado para valor formatado em moeda brasileira
  const [amountFormatted, setAmountFormatted] = useState('')

  // Máscara BRL: converte dígitos em valor com vírgula decimal automática
  // Ex: digitar "13200" → "132,00" | "1320000" → "13.200,00"
  const formatAsCurrency = (inputValue: string): string => {
    const digits = inputValue.replace(/\D/g, '')
    if (!digits) return ''
    const numericValue = parseInt(digits, 10)
    if (!numericValue) return ''
    return (numericValue / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Converte valor formatado ("1.320,00") de volta para número (1320)
  const parseCurrencyToNumber = (formatted: string): number => {
    return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0
  }

  // Inicializa o campo formatado quando há dados de edição
  useEffect(() => {
    if (initialData?.amount != null) {
      const absAmount = Math.abs(Number(initialData.amount))
      if (absAmount > 0) {
        setAmountFormatted(
          absAmount.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        )
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Função de submit: converte valor formatado e aplica status de ação se houver
  const handleFormSubmit = (data: TransactionFormData) => {
    const numericValue = parseCurrencyToNumber(amountFormatted)
    const finalStatus = statusOverrideRef.current ?? data.status ?? 'PENDENTE'
    statusOverrideRef.current = null
    onSubmit({
      ...data,
      amount: numericValue,
      status: finalStatus as TransactionFormData['status']
    })
  }

  // Submete o form com um status específico (Confirmar / Conciliar)
  const submitWithStatus = (status: 'CONFIRMADO' | 'CONCILIADO') => {
    statusOverrideRef.current = status
    formRef.current?.requestSubmit()
  }

  return (
    <Box
      ref={formRef}
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}
    >
      {/* TIPO DE LANÇAMENTO */}
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup {...field} exclusive fullWidth size="small">
            <ToggleButton value="RECEITA" color="success">
              <ReceitaIcon fontSize="small" sx={{ mr: 0.5 }} />
              Receita
            </ToggleButton>
            <ToggleButton value="DESPESA" color="error">
              <DespesaIcon fontSize="small" sx={{ mr: 0.5 }} />
              Despesa
            </ToggleButton>
            <ToggleButton value="TRANSFERENCIA" color="primary">
              <TransfIcon fontSize="small" sx={{ mr: 0.5 }} />
              Transferência
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      />

      {/* VALOR e DATA */}
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <TextField
              label="Valor *"
              value={amountFormatted}
              onChange={(e) => {
                const formatted = formatAsCurrency(e.target.value)
                setAmountFormatted(formatted)
                field.onChange(parseCurrencyToNumber(formatted))
              }}
              placeholder="0,00"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
          )}
        />

        <Controller
          name="due_date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Data *"
              type="date"
              InputLabelProps={{ shrink: true }}
              error={!!errors.due_date}
              helperText={errors.due_date?.message}
              inputProps={{ 'aria-label': 'data' }}
            />
          )}
        />
      </Box>

      {/* DESCRIÇÃO */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Descrição *"
            error={!!errors.description}
            helperText={errors.description?.message}
            inputProps={{ 'aria-label': 'descrição' }}
          />
        )}
      />

      {/* CONTA DE ORIGEM */}
      <Controller
        name="account_id"
        control={control}
        render={({ field }) => (
          <FormControl error={!!errors.account_id} fullWidth>
            <InputLabel id="account-label">
              {transactionType === 'TRANSFERENCIA' ? 'Conta Origem *' : 'Conta *'}
            </InputLabel>
            <Select
              {...field}
              labelId="account-label"
              label={transactionType === 'TRANSFERENCIA' ? 'Conta Origem *' : 'Conta *'}
              inputProps={undefined}
            >
              {accounts.map(acc => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.account_id?.message}</FormHelperText>
          </FormControl>
        )}
      />

      {/* CONTA DESTINO — somente em Transferência */}
      {transactionType === 'TRANSFERENCIA' && (
        <Controller
          name="destination_account_id"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Conta Destino *</InputLabel>
              <Select {...field} label="Conta Destino *">
                {accounts.map(acc => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      )}

      {/* CATEGORIA — ocultar em Transferência */}
      {transactionType !== 'TRANSFERENCIA' && (
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="category-label">Categoria *</InputLabel>
              <Select
                {...field}
                labelId="category-label"
                label="Categoria *"
                inputProps={undefined}
              >
                {filteredCategories.map(cat => [
                  <MenuItem
                    key={cat.id}
                    value={cat.id}
                    disabled={settings.require_subcategory && cat.children.length > 0}
                  >
                    {cat.name}
                  </MenuItem>,
                  ...cat.children.map(sub => (
                    <MenuItem key={sub.id} value={sub.id} sx={{ pl: 4 }}>
                      └ {sub.name}
                    </MenuItem>
                  )),
                ])}
              </Select>
            </FormControl>
          )}
        />
      )}


      {/* DATA DE COMPETÊNCIA — condicional ao flag */}
      {settings.enable_competence_date && (
        <Controller
          name="competence_date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Data de Competência"
              type="date"
              InputLabelProps={{ shrink: true }}
              helperText="Quando a despesa pertence (para DRE por competência)"
              inputProps={{ 'aria-label': 'data de competência' }}
            />
          )}
        />
      )}

      <Divider>
        <Typography variant="caption" color="text.secondary">
          REPETIÇÃO
        </Typography>
      </Divider>

      {/* TIPO DE REPETIÇÃO */}
      <Controller
        name="repetition_type"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel id="rep-label">Repetição</InputLabel>
            <Select
              {...field}
              labelId="rep-label"
              label="Repetição"
              inputProps={{ 'aria-label': 'repetição' }}
            >
              <MenuItem value="NONE">Sem repetição</MenuItem>
              <MenuItem value="FIXO">Fixo (repete todo mês)</MenuItem>
              <MenuItem value="PARCELADO">Parcelado (dividir em parcelas)</MenuItem>
            </Select>
          </FormControl>
        )}
      />

      {/* FIXO — duração opcional */}
      {repetitionType === 'FIXO' && (
        <Controller
          name="fixed_months"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Por quantos meses? (em branco = indefinido)"
              type="number"
              inputProps={{ min: 1 }}
              helperText="Deixe em branco para repetir indefinidamente"
            />
          )}
        />
      )}

      {/* PARCELADO */}
      {repetitionType === 'PARCELADO' && (
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
          <Controller
            name="installments"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Número de Parcelas *"
                type="number"
                inputProps={{ min: 2, 'aria-label': 'parcelas' }}
                error={!!errors.installments}
                helperText={errors.installments?.message}
              />
            )}
          />

          <TextField
            disabled
            label="Valor por Parcela (calculado)"
            value={installmentPreview}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
            helperText="Calculado automaticamente"
          />
        </Box>
      )}

      <Divider>
        <Typography variant="caption" color="text.secondary">
          OPCIONAL
        </Typography>
      </Divider>

      {/* CENTRO DE CUSTO */}
      {(costCenters.length > 0 || settings.require_cost_center) && (
        <Controller
          name="center_id"
          control={control}
          render={({ field }) => (
            <FormControl
              fullWidth
              error={settings.require_cost_center && !centerIdValue}
            >
              <InputLabel>
                Centro de Custo {settings.require_cost_center ? '*' : ''}
              </InputLabel>
              <Select
                {...field}
                label={`Centro de Custo ${settings.require_cost_center ? '*' : ''}`}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {costCenters.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
              {settings.require_cost_center && !centerIdValue && (
                <FormHelperText>Centro de custo é obrigatório</FormHelperText>
              )}
            </FormControl>
          )}
        />
      )}

      {/* PROJETO */}
      {(projects.length > 0 || settings.require_project) && (
        <Controller
          name="project_id"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Projeto {settings.require_project ? '*' : ''}</InputLabel>
              <Select
                {...field}
                label={`Projeto ${settings.require_project ? '*' : ''}`}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {projects.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      )}

      {/* CONTATO */}
      {(contacts.length > 0 || settings.require_contact) && (
        <Controller
          name="contact_id"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Contato {settings.require_contact ? '*' : ''}</InputLabel>
              <Select
                {...field}
                label={`Contato ${settings.require_contact ? '*' : ''}`}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {contacts.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      )}

      {/* OBSERVAÇÕES */}
      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Observações" multiline rows={2} />
        )}
      />

      {/* BOTÕES — ações de status + salvar */}
      <Divider />
      <Box display="flex" alignItems="center" justifyContent="space-between" pt={0.5}>
        {/* Ações rápidas de status */}
        <Box display="flex" gap={1}>
          <Tooltip title="Confirmar lançamento">
            <span>
              <IconButton
                onClick={() => submitWithStatus('CONFIRMADO')}
                disabled={isLoading}
                sx={{
                  color: '#22c55e',
                  border: '1.5px solid #22c55e',
                  borderRadius: 1.5,
                  p: 0.8,
                  '&:hover': { bgcolor: '#dcfce7' }
                }}
              >
                <DoneIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Conciliar lançamento">
            <span>
              <IconButton
                onClick={() => submitWithStatus('CONCILIADO')}
                disabled={isLoading}
                sx={{
                  color: '#06b6d4',
                  border: '1.5px solid #06b6d4',
                  borderRadius: 1.5,
                  p: 0.8,
                  '&:hover': { bgcolor: '#cffafe' }
                }}
              >
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Anexar arquivo">
            <span>
              <IconButton
                disabled
                sx={{ color: '#9ca3af', border: '1.5px solid #e5e7eb', borderRadius: 1.5, p: 0.8 }}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Salvar como Pendente */}
        <Button type="submit" variant="contained" disabled={isLoading}
          sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, px: 3 }}
        >
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </Box>
    </Box>
  )
}
