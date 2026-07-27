# Aurora OS — Monorepo (Next.js + Expo + Supabase)

Monorepo pnpm com o backend real do Aurora OS (schema, RLS e sincronização),
um app web em Next.js e um app mobile em Expo.

## Estrutura

```
apps/
  web/      Next.js 16 (App Router) — usa @supabase/ssr
  mobile/   Expo (React Native) — usa @supabase/supabase-js
packages/
  shared/   Tipos gerados do banco (Database) + factory de client Supabase
supabase/
  migrations/  Schema real (aurora-os-schema-banco-dados.sql +
               aurora-os-auth-e-sincronizacao-servidor.sql), aplicadas em ordem
```

## Migrations

As migrations em `supabase/migrations/` são os dois arquivos fornecidos como
base real do backend, na ordem:

1. `20260727000001_schema_inicial.sql` — schema completo (todos os módulos).
   Corrigido: a view `runway_atual` não tinha `FROM lancamento_financeiro`
   na query externa (bug no SQL original — testado e corrigido).
2. `20260727000002_auth_rls_sincronizacao.sql` — RLS "autenticado = acesso
   total" (via loop automático) + suporte de sincronização/idempotência.
3. `20260727000003_rls_tabelas_sincronizacao.sql` — corrige RLS que faltou
   em `idempotencia_acao` e `conflito_sincronizacao` (essas tabelas são
   criadas no arquivo 2 *depois* do loop que habilita RLS, então ficavam
   de fora).
4. `20260727000004_grants_authenticated.sql` — GRANTs explícitos de
   privilégio à role `authenticated` (Supabase atual não expõe tabelas
   novas automaticamente via PostgREST; RLS sozinho não é suficiente).

Todas testadas rodando `supabase start` + `supabase db reset` localmente,
com verificação real via REST API (login, insert, select autenticado
bloqueado para `anon`, view `runway_atual`, função de idempotência).

## Rodando localmente

Pré-requisitos: Docker rodando, Node 20+, pnpm.

```bash
# 1. instalar dependências do monorepo
pnpm install

# 2. subir Supabase local (Postgres + Auth + API) e aplicar as migrations
pnpm supabase:start
# (roda 4 migrations acima; ao final imprime ANON_KEY/URL locais)

# 3. criar a única usuária (Aurora OS é single-user — ver comentários na
#    migration 2). Uma vez, via Supabase Studio (http://127.0.0.1:54323)
#    ou via curl ao endpoint admin:
curl -X POST 'http://127.0.0.1:54321/auth/v1/admin/users' \
  -H "apikey: <SERVICE_ROLE_KEY>" -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@exemplo.com","password":"...","email_confirm":true}'

# 4a. rodar o web
cp apps/web/.env.local.example apps/web/.env.local  # já aponta para o Supabase local
pnpm dev:web       # http://localhost:3000

# 4b. rodar o mobile (Expo)
pnpm dev:mobile
```

`apps/web/.env.local.example` e `apps/mobile/.env` já usam a `ANON_KEY` e a
URL padrão do Supabase local (mesmas para qualquer projeto local, não são
segredo). Para apontar para um projeto Supabase remoto, troque os valores
pela URL/anon key do projeto e rode as migrations com
`supabase link` + `supabase db push`.

### Comandos úteis

- `pnpm supabase:reset` — recria o banco local do zero e reaplica as 4 migrations.
- `pnpm supabase:stop` — para os containers do Supabase local.
- `pnpm build:web` — build de produção do Next.js.

## O que já foi validado

- As 46 tabelas + a view `runway_atual` do schema aplicam sem erro.
- RLS habilitado em 100% das tabelas de `public`, nenhuma policy para `anon`.
- Login real (Supabase Auth) → Server Component do Next.js lê
  `categoria_financeira` com sucesso; usuária `anon` sem sessão recebe
  `permission denied` (42501), confirmando o isolamento single-user.
- Função `registrar_acao_idempotente` (idempotência da fila offline) e a
  view `runway_atual` (Finanças) testadas com dados reais.
- `pnpm --filter web build` e `tsc --noEmit` passam em web e mobile.
