# Correções da auditoria financeira — 06/10/2026

## Escopo e estado

Este pacote corrige cálculos, persistência e isolamento de usuários. A migração SQL foi validada em PostgreSQL isolado; não foi aplicada ao banco de produção durante a preparação deste pacote. O código e a migração devem ser publicados de forma coordenada. Não se deve habilitar o novo isolamento enquanto o servidor antigo ainda faz consultas anônimas.

## Alterações

- A01–A02: cliente Supabase autenticado por requisição, sem compartilhar sessão; migração habilita RLS, remove privilégios anônimos e impede alteração do próprio plano. Testes com dois usuários e acesso anônimo.
- A03–A11: despesas negativas; transferências com duas pontas atômicas, identidade comum e soma zero; vencimentos limitados ao último dia do mês; parcelas preservam os centavos; saldos incluem abertura e histórico completo. Pagamentos confirmados e conciliados usam a data efetiva de pagamento.
- A12–A15: categorias sem classificação deixam de desaparecer, impostos reduzem receita líquida, detalhamento mensal é consolidado e saldo de caixa inclui abertura. Indicadores indisponíveis não aparecem como zero.
- A16–A19: conciliação exige a conta, controla FITID, valor e data em transação SQL; confirmar parcela funciona; contratos de fechamento e orçamento foram corrigidos.
- A20: metas e planejamento passam a ter persistência por usuário, controle de versão e indicação de erros. Realizado por centro considera despesas pagas no mês. Cartões e integração contábil deixam de exibir operações simuladas como funcionalidades prontas.
- A21–A22: investimento recalcula totais em atualizações parciais; migração cria a tabela ausente e permite o grupo INVESTIMENTOS.
- A23: demonstrativo e indicadores recebem nomes gerenciais compatíveis com seus cálculos. Isso não implementa contabilidade formal, balanço patrimonial completo ou DFC por atividades.
- A24: campos opcionais podem ser limpos, etiquetas são persistidas inclusive nas parcelas e datas/valores recebem validação. Vínculos financeiros de outro usuário são rejeitados pelo banco.
- A25–A27: não há exclusão de usuário por coincidência de e-mail, rotas de teste/escrita administrativa públicas foram desativadas, limites de armazenamento usam bytes convertidos em MB e usuário sem plano não recebe privilégios administrativos.
- A28: regressões financeiras e testes de banco entram na integração contínua; lint usa o comando compatível com Next.js instalado.

## Regras de compatibilidade

Datas de pagamento ou competência ausentes nos registros antigos usam vencimento como fallback explícito. A migração não inventa datas históricas nem reclassifica automaticamente antigas receitas/despesas que possam representar transferências. Esses registros precisam de revisão orientada pelos dados antes de qualquer alteração retroativa.

## Validação

325 testes Jest, 16 cenários da auditoria e 14 verificações SQL de isolamento/integridade. Também foram executados TypeScript, ESLint e build de produção. Os testes SQL usam PGlite, sem acessar dados financeiros reais. Não substituem a homologação do login e dos fluxos completos em um projeto Supabase de testes.

## Publicação e pendências

1. Homologar o pacote com cópia anonimizada do esquema e autenticação Supabase de testes; verificar login, lançamento, confirmação, transferência, recorrência, conciliação e salvamento de metas.
2. Preparar backup e janela de atualização para aplicar `supabase/migrations/20261006194244_audit_financial_integrity.sql` junto do novo servidor.
3. Confirmar isolamento de usuários, privilégio anônimo, login e operações no ambiente publicado. Em rollback, manter RLS e usar versão compatível com autenticação por requisição; não restaurar acesso anônimo.

Ainda não há contabilidade por partidas dobradas, fechamento com bloqueio de período, cartões completos ou exportação contábil real. Consolidar moedas diferentes exige política explícita de câmbio; o extrato rejeita consolidação de moedas incompatíveis, mas os demais relatórios precisam de evolução equivalente. Limites comerciais verificados no serviço ainda podem sofrer concorrência entre requisições; uma quota transacional no banco é uma melhoria adicional. Esta entrega não é certificação de que todo fluxo ou dado histórico esteja correto.
