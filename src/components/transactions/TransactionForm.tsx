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
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, TextField, Select, MenuItem, FormControl, InputLabel,
  FormHelperText, Switch, FormControlLabel, Button, Divider,
  ToggleButtonGroup, ToggleButton, Typography, InputAdornment,
} from '@mui/material'
import {
  ArrowUpward as ReceitaIcon,
  ArrowDownward as DespesaIcon,
  SwapHoriz as TransfIcon,
} from '@mui/icons-material'

const transactionSchema = z.object({
  type: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  due_date: z.string().min(1, 'Data é obrigatória'),
  account_id: z.string().min(1, 'Conta é obrigatória'),
  category_id: z.string().optional(),
  destination_account_id: z.string().optional(),
  status: z.enum(['PENDENTE', 'CONFIRMADO']),
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

  const transactionType = watch('type')
  const repetitionType = watch('repetition_type')
  const statusValue = watch('status')
  const centerIdValue = watch('center_id')
  const isConfirmed = statusValue === 'CONFIRMADO'

  const filteredCategories = categories.filter(c => {
    if (transactionType === 'RECEITA') return c.type === 'RECEITA'
    if (transactionType === 'DESPESA') return c.type === 'DESPESA'
    return false
  })

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
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
              {...field}
              label="Valor *"
              type="number"
              inputProps={{ min: 0, step: 0.01, 'aria-label': 'valor' }}
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

      {/* STATUS — Pendente / Confirmado */}
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value === 'CONFIRMADO'}
                onChange={e => field.onChange(e.target.checked ? 'CONFIRMADO' : 'PENDENTE')}
                color="success"
              />
            }
            label={isConfirmed ? 'Confirmado ✓' : 'Pendente'}
          />
        )}
      />

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

          {settings.installment_default === 'VALOR_PARCELA' ? (
            <Controller
              name="installment_amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Valor da Parcela *"
                  type="number"
                  inputProps={{ min: 0.01, step: 0.01, 'aria-label': 'valor da parcela' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              )}
            />
          ) : (
            <TextField
              disabled
              label="Valor por Parcela (calculado)"
              helperText="Calculado automaticamente ao salvar"
            />
          )}
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

      {/* BOTÕES */}
      <Box display="flex" gap={2} justifyContent="flex-end" pt={1}>
        <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Lançamento'}
        </Button>
      </Box>
    </Box>
  )
}
