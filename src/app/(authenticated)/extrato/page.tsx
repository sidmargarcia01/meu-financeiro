export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'

export default function ExtratoContasPage() {
  redirect('/movimentacoes/extrato')
}
