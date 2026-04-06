/**
 * CAMADA: Componentes UI
 * MÓDULO: Dashboard - Widget Categorias
 * RESPONSABILIDADE: Exibir distribuição de despesas por categoria
 * NÃO DEVE: Conter lógica de negócio, apenas apresentação
 * DEPENDE DE: useDistribuicaoCategorias hook
 */

'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Chip,
  Button
} from '@mui/material'
import { 
  PieChart, 
  MoreVert,
  Category,
  LocalOffer,
  Restaurant,
  ShoppingBag,
  Home,
  LocalHospital,
  School,
  DirectionsCar,
  Devices,
  Payments,
  Refresh
} from '@mui/icons-material'
import { useDistribuicaoCategorias } from '@/hooks/dashboard'
import { formatCurrency } from '@/utils/formatCurrency'

interface CategoriasWidgetProps {
  className?: string
  mes: number
  ano: number
}

// Mapeamento de ícones para categorias comuns
const categoryIcons: Record<string, JSX.Element> = {
  'alimentação': <Restaurant />,
  'comida': <Restaurant />,
  'restaurante': <Restaurant />,
  'supermercado': <ShoppingBag />,
  'mercado': <ShoppingBag />,
  'moradia': <Home />,
  'aluguel': <Home />,
  'saúde': <LocalHospital />,
  'médico': <LocalHospital />,
  'educação': <School />,
  'escola': <School />,
  'transporte': <DirectionsCar />,
  'combustível': <DirectionsCar />,
  'tecnologia': <Devices />,
  'eletrônicos': <Devices />,
  'serviços': <Payments />,
  'default': <Category />
}

const categoryColors: Record<string, string> = {
  'alimentação': '#FF6384',
  'moradia': '#36A2EB',
  'transporte': '#FFCE56',
  'saúde': '#4BC0C0',
  'educação': '#9966FF',
  'lazer': '#FF9F40',
  'outros': '#C9CBCF'
}

export function CategoriasWidget({ className, mes, ano }: CategoriasWidgetProps) {
  const { data, loading, error, refetch } = useDistribuicaoCategorias({ mes, ano })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
            <Typography color="error" variant="body2">
              Não foi possível carregar os dados.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => refetch()}
              startIcon={<Refresh />}
            >
              Tentar novamente
            </Button>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <Typography color="text.secondary">
              Nenhuma despesa por categoria encontrada
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getCategoryIcon = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase()
    
    // Procurar por correspondência exata ou parcial
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (normalizedName.includes(key)) {
        return icon
      }
    }
    
    return categoryIcons.default
  }

  const getCategoryColor = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase()
    
    for (const [key, color] of Object.entries(categoryColors)) {
      if (normalizedName.includes(key)) {
        return color
      }
    }
    
    return categoryColors.outros
  }

  // Gráfico de pizza simplificado
  const SimplePieChart = () => {
    const total = data.reduce((sum, cat) => sum + cat.total, 0)
    let currentAngle = 0

    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <svg width={180} height={180} viewBox="0 0 180 180">
          {data.map((categoria, index) => {
            const percentage = categoria.total / total
            const angle = percentage * 360
            const endAngle = currentAngle + angle
            
            // Converter para radianos
            const startRad = (currentAngle * Math.PI) / 180
            const endRad = (endAngle * Math.PI) / 180
            
            // Calcular coordenadas do arco
            const x1 = 90 + 80 * Math.cos(startRad)
            const y1 = 90 + 80 * Math.sin(startRad)
            const x2 = 90 + 80 * Math.cos(endRad)
            const y2 = 90 + 80 * Math.sin(endRad)
            
            const largeArcFlag = angle > 180 ? 1 : 0
            
            const pathData = [
              `M 90 90`,
              `L ${x1} ${y1}`,
              `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ')
            
            currentAngle = endAngle
            
            return (
              <path
                key={categoria.category_id}
                d={pathData}
                fill={getCategoryColor(categoria.category_name)}
                stroke="white"
                strokeWidth={2}
              />
            )
          })}
        </svg>
      </Box>
    )
  }

  return (
    <Card className={className}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <PieChart color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              Distribuição por Categoria
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>

        <Typography variant="subtitle2" color="text.secondary" mb={2}>
          Despesas de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </Typography>

        {/* Gráfico */}
        <SimplePieChart />

        {/* Lista de categorias */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Detalhes por Categoria
          </Typography>
          <List dense>
            {data.map((categoria) => (
              <ListItem key={categoria.category_id} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box sx={{ color: getCategoryColor(categoria.category_name) }}>
                    {getCategoryIcon(categoria.category_name)}
                  </Box>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight="medium">
                        {categoria.category_name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(categoria.total)}
                        </Typography>
                        <Chip
                          label={`${categoria.percentual.toFixed(1)}%`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                  secondary={
                    <LinearProgress
                      variant="determinate"
                      value={categoria.percentual}
                      sx={{
                        mt: 0.5,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getCategoryColor(categoria.category_name)
                        }
                      }}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Total geral */}
        <Box mt={2} pt={2} borderTop={1} borderColor="divider">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" fontWeight="bold">
              Total de Despesas
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="error.main">
              {formatCurrency(data.reduce((sum, cat) => sum + cat.total, 0))}
            </Typography>
          </Box>
        </Box>

        {/* Menu de opções */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { refetch(); handleMenuClose(); }}>
            Atualizar
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
}
