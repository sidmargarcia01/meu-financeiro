# Configuração e publicação

Configure as variáveis no painel Vercel, sem salvar valores no Git:

- NEXT_PUBLIC_SUPABASE_URL: URL do projeto.
- NEXT_PUBLIC_SUPABASE_ANON_KEY: chave pública do projeto.
- SUPABASE_SERVICE_ROLE_KEY: chave administrativa, exclusivamente no servidor.
- DATABASE_URL e DIRECT_URL: conexões PostgreSQL obtidas no painel Supabase.

O aplicativo usa Supabase Auth; não configure segredos JWT próprios para autenticar APIs.
Use Node 24 e npm ci. O workflow CI verifica testes e build antes da publicação.
Credenciais antigas incluídas no histórico devem ser consideradas expostas e substituídas no provedor; excluir arquivos não remove o histórico.
Consulte docs/audit-remediation-2026-10-06.md para a atualização coordenada do banco.
