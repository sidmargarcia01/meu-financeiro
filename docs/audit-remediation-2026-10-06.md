# Correções da auditoria financeira — 06/10/2026

## Escopo e estado

Este pacote corrige cálculos, persistência e isolamento de usuários. A expansão de esquema e a restauração do gatilho de perfis já foram aplicadas e verificadas. A migração de isolamento deve ser aplicada assim que o novo servidor estiver publicado. A checagem smoke-production aguarda essa etapa e verifica o endereço oficial.

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

325 testes Jest, 16 cenários financeiros, 14 verificações PostgreSQL e sete verificações autenticadas de integração passaram, além de TypeScript, ESLint e build. A integração real usa dois usuários temporários no Supabase, login pela API, criação de contas/categorias/despesas, confirmação, transferência, parcelas no fim do mês e persistência de planejamento. Os usuários e seus registros são removidos em finally. O teste da versão publicada acrescenta RLS, revogação do acesso anônimo e repetição idempotente de OFX.

## Publicação e pendências

O workflow duplicado de deploy foi removido. O pipeline de publicação exige validação de qualidade e não oculta falhas. Ele usa Node 24, Next.js 16.4.0 e Vercel CLI 62.5.0. Os arquivos com credenciais antigas e os helpers inseguros foram retirados; uma verificação no CI impede sua reintrodução. As duas chaves administrativas antigas testadas foram rejeitadas com HTTP 401. Remover arquivos não apaga segredos do histórico; credenciais históricas devem permanecer revogadas.

Dependências de produção: zero vulnerabilidades em npm audit --omit=dev. Inventário completo: 26 avisos em ferramentas de desenvolvimento, provenientes de braces e sprintf-js, sem correção publicada para as versões usadas. Esses avisos continuam visíveis e documentados; não representam 26 falhas distintas do código do app. Referências: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm e https://github.com/advisories/GHSA-hp3w-g68c-fv3c.

O teste real revelou dois erros adicionais, corrigidos: ausência do gatilho de criação do perfil financeiro e inserções em lote que enviavam etiquetas nulas. A criação do perfil agora é atômica com Supabase Auth; transferências sem etiquetas enviam uma lista vazia.

1. Expansão compatível: 20261006203405_audit_expand_compatibility.sql. Mantém o servidor antigo funcionando e protege imediatamente as tabelas novas.
2. Gatilho de perfis: 20261006205343_restore_auth_profile_trigger.sql. Não reescreve usuários existentes.
3. Publicar o servidor validado e aplicar 20261006194244_audit_financial_integrity.sql. O script de produção aguarda o bloqueio do acesso anônimo antes de testar.
4. Conferir RLS, advisors, nove verificações autenticadas na URL oficial e preservação dos dados originais: 578 lançamentos, 4 contas e 5 usuários antes dos testes.

Rollback de código deve manter RLS e usar versão compatível com autenticação por requisição; não restaurar privilégios anônimos.

Ainda não há contabilidade por partidas dobradas, fechamento com bloqueio de período, cartões completos ou exportação contábil real. Consolidar moedas diferentes exige política explícita de câmbio; o extrato rejeita consolidação de moedas incompatíveis, mas os demais relatórios precisam de evolução equivalente. Limites comerciais verificados no serviço ainda podem sofrer concorrência entre requisições; uma quota transacional no banco é uma melhoria adicional. Esta entrega não é certificação de que todo fluxo ou dado histórico esteja correto.
