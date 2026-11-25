# Meu Financeiro no servidor 122

Endereço de produção: **https://financeiro.msassist.com.br**.

A partir de 25/11/2026, aplicação, autenticação e PostgreSQL são executados no
Windows Server 177.11.54.122. Supabase e Vercel foram pausados depois da cópia e
da validação. Não há chamadas de produção ao Supabase, Vercel ou Railway.
O GitHub guarda o código e executa testes; a aplicação continua funcionando
independentemente do GitHub.

## Instalação em produção

| Componente | Configuração |
| --- | --- |
| Diretório | `C:\ProgramData\MeuFinanceiro` |
| Banco | PostgreSQL 17, banco `meu_financeiro`, loopback `127.0.0.1:5440` |
| Serviço do banco | `MeuFinanceiroPostgres`, inicialização automática |
| Aplicação | Node 24 / Next 16.4.6, loopback `127.0.0.1:3220` |
| Serviço da aplicação | `MeuFinanceiroWeb`, conta virtual própria, reinício automático |
| HTTPS | Caddy existente, site independente `financeiro.msassist.com.br` |
| Configuração privada | `secrets\app.env`; nunca versionar ou publicar |
| Backups | `backups`, tarefa Windows `MeuFinanceiro-Backup`, diariamente às 03:00 do servidor |

O banco e a aplicação têm contas próprias e não usam as credenciais dos outros
projetos. O login do processo web é `financeiro_server`, sem privilégios de
superusuário. As consultas financeiras assumem `financeiro_app` dentro de uma
transação e mantêm o isolamento por usuário com RLS. Não abrir a porta 5440 na
internet. As sessões locais usam tokens aleatórios de 32 bytes, apenas seu hash
no banco, cookie HttpOnly/Secure/SameSite e validade de 12 horas. Os cookies e
tokens antigos do Supabase não são aceitos.

## Dados e conferência da migração

Foram copiados 1.201 registros em 58 tabelas, incluindo 596 lançamentos, quatro
contas, cinco perfis e três identidades de autenticação. Os hashes de senha
foram preservados; os usuários existentes entram com o mesmo email e senha.
Não havia objetos ou buckets no Storage para transferir. Duas linhas de perfil
sem identidade de autenticação também foram preservadas; nenhum lançamento
ficou sem sua identidade de autenticação.

A restauração foi comparada com a exportação usando diferenças de conjuntos
com multiplicidade (`EXCEPT ALL`) de todas as colunas, nas 58 tabelas. Nenhuma
diferença. Uma segunda leitura do Supabase após pausar a versão antiga da
Vercel também não encontrou alterações. A aplicação nova passou por 17 testes
HTTP de integração em banco isolado e 51 leituras autenticadas em produção.
Essas leituras recuperaram os 596 lançamentos, incluindo a paginação acima de
500 linhas. Os testes de gravação usaram somente o banco de teste separado.

As exportações completas, hashes de senha e backups contêm dados privados.
Ficam fora do Git e da pasta pública. O SQL em `database/native` contém apenas
estrutura, regras, funções e permissões, sem registros dos clientes.

## Instalação nova e desenvolvimento

Usar PostgreSQL 17 em instância separada, banco vazio, extensões `pgcrypto` e
`uuid-ossp` disponíveis. Definir `ADMIN_DATABASE_URL` com o proprietário para
provisionamento e `DATABASE_URL` com `financeiro_server` e uma senha aleatória.
Os dois URLs devem apontar para o mesmo banco. Executar:

```text
npm ci
node scripts/bootstrap-native.cjs
npm run dev
```

O bootstrap é somente para instalação vazia; não executá-lo no banco já
migrado. Não usar `prisma db push` nem reaplicar os scripts históricos da pasta
`supabase` em produção. Eles são mantidos como histórico/testes de regressão.
As antigas rotinas de conexão ao Supabase também não participam da operação.

Os testes de integração exigem um banco descartável cujo nome termine com
`_smoke_YYYYMMDD`, configurado em `SMOKE_ADMIN_DATABASE_URL` e `DATABASE_URL`.
Nunca apontar esse teste para o banco de produção.

## Contas e senhas

O cadastro público e o envio de recuperação por email não utilizam mais o
Supabase. Novas contas e redefinições são feitas pelo administrador local,
usando `scripts/manage-user.cjs`, com `ADMIN_DATABASE_URL` configurada somente
durante o comando. A senha nova é lida de um arquivo privado, e não de um
argumento da linha de comando:

```text
node scripts/manage-user.cjs create EMAIL NOME ARQUIVO_PRIVADO_DA_SENHA
node scripts/manage-user.cjs reset-password EMAIL ARQUIVO_PRIVADO_DA_SENHA
node scripts/manage-user.cjs approve EMAIL
```

No servidor 122, a ferramenta já está instalada em C:\ProgramData\MeuFinanceiro\admin\admin-users.ps1. Ela carrega a credencial administrativa privada apenas durante o comando. Execute em sessão administrativa com os parâmetros -Action, -Email, -Name (para criar) e -PasswordFile (para criar ou redefinir).

O administrador deve conferir a identidade do solicitante. Senhas novas têm
pelo menos 12 caracteres e até 72 bytes UTF-8. Redefinições revogam sessões.
Não disponibilizar esses comandos em rotas HTTP nem colocar a URL administrativa
na configuração do processo web.

## Atualização e recuperação

Gerar `npm run build` em Windows, empacotar `.next/standalone` com
`.next/static` e `public`, excluindo qualquer `.env`. Transferir o pacote com
conexão cifrada, conferir SHA-256 e extrair em nova pasta de release. Atualizar
o diretório da release no serviço, preservar as configurações e fazer backup
antes da troca. Testar `/api/health`, login e isolamento de dados. Não usar jobs
de deploy para Vercel ou Railway.

O backup diário usa `pg_dump -Fc`, valida o índice do arquivo e guarda SHA-256;
retém 30 dias. A cópia inicial e as exportações também foram guardadas no
computador do proprietário. Backups futuros só no mesmo servidor não cobrem
perda do servidor inteiro: manter uma cópia externa sob controle próprio.
Para recuperar, restaurar com `pg_restore --no-owner` em banco separado,
recriar os papéis locais e sua senha com permissões equivalentes e validar os
registros antes de trocar a aplicação. A instância de teste da migração foi
separada da produção.
