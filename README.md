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

## Deploy do web (Vercel)

O Vercel roda na nuvem e não alcança o Supabase local (`127.0.0.1`), então
deploy real exige um projeto Supabase **hospedado** (supabase.com) com as
migrations aplicadas nele — o app local em Docker é só para desenvolvimento.

1. **Criar o projeto hospedado**: [supabase.com/dashboard](https://supabase.com/dashboard)
   → New Project. Anote a **Project Reference** (ex.: `abcdefghijklmnop`) e a
   senha do banco definida na criação.

2. **Aplicar as migrations reais nele** (a partir da raiz do repo):
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push   # aplica as 4 migrations de supabase/migrations/
   ```

3. **Criar a única usuária** no projeto hospedado (mesmo `curl` do passo 3 do
   "Rodando localmente", mas trocando a URL para
   `https://<project-ref>.supabase.co` e a `SERVICE_ROLE_KEY` pela do projeto
   hospedado — Settings → API no dashboard do Supabase).

4. **Conectar o repo no Vercel**: [vercel.com/new](https://vercel.com/new) →
   importar `julianassilvagomes-glitch/aurora-os` → em "Root Directory"
   selecione `apps/web` (o Vercel detecta o pnpm-workspace.yaml na raiz e
   instala o monorepo inteiro automaticamente; Framework Preset "Next.js" é
   detectado sozinho).

5. **Variáveis de ambiente** do projeto Vercel (Settings → Environment
   Variables), com os valores de Settings → API do projeto Supabase hospedado:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key do projeto hospedado

6. Deploy. O Vercel te dá o link (`https://<nome-do-projeto>.vercel.app`) e
   passa a fazer redeploy automático a cada push em `main`.

## Testando o mobile no Expo Go

1. Instale o app **Expo Go** no celular (App Store / Play Store).
2. Aponte `apps/mobile/.env` para um Supabase alcançável pelo celular — o
   valor padrão (`http://127.0.0.1:54321`) só funciona em emulador/simulador
   rodando na mesma máquina do Supabase local, **não** num celular físico:
   - Testando com o Supabase local: troque para o IP da sua máquina na rede
     local (ex.: `http://192.168.0.42:54321` — mesmo Wi-Fi do celular).
   - Testando contra o projeto hospedado (depois do passo de deploy acima):
     use `https://<project-ref>.supabase.co` + a anon key do projeto — assim
     dá pra testar em qualquer rede, inclusive dados 4G/5G.
3. Na raiz do repo: `pnpm install` (se ainda não rodou) e depois
   `pnpm dev:mobile` (ou `cd apps/mobile && pnpm start`).
4. O terminal mostra um QR code.
   - **Android**: abra o app Expo Go e escaneie o QR code direto por ele.
   - **iPhone**: escaneie o mesmo QR code pela câmera nativa do iOS — ela
     reconhece o link do Expo e abre no Expo Go automaticamente.
   - Celular e computador precisam estar na **mesma rede Wi-Fi**. Se a rede
     bloquear conexão direta entre dispositivos (comum em Wi-Fi de
     empresa/evento), rode `pnpm start --tunnel` em vez de `pnpm start` —
     mais lento, mas passa por um túnel do Expo em vez de LAN direta.
5. Faça login com a mesma usuária criada no passo 3 do Supabase (local ou
   hospedado, conforme o que você apontou no `.env`).
6. Para testar a sincronização offline: ative o modo avião, crie um
   lançamento (ele aparece marcado "pendente de sincronização"), desative o
   modo avião — a sincronização dispara sozinha, ou toque em
   "sincronizar agora".

## Módulo de Finanças

- **Web** (`apps/web/app/financas`): dashboard de runway (view `runway_atual`),
  criação/exclusão de lançamentos financeiros e categorias, via Server Actions.
- **Mobile** (`apps/mobile`): mesma tela de Finanças, mas *offline-first* — ver
  próxima seção.

## Sincronização offline (mobile)

O app mobile segue o mecanismo descrito na migration
`20260727000002_auth_rls_sincronizacao.sql`: fila local (outbox) + idempotência
no servidor via `registrar_acao_idempotente`.

- `lib/outbox.ts` — fila persistida em `AsyncStorage`. Cada ação tem uma
  `chave` gerada no cliente (`expo-crypto`) que dobra como id da linha quando é
  uma criação, então o registro final no servidor usa o mesmo id do item
  otimista mostrado offline (sem "trocar de id" depois de sincronizar).
- `lib/lancamentos.ts` — `criarLancamentoOffline`/`excluirLancamento` só
  gravam na fila; `processarFila` a drena em ordem (FIFO), chamando
  `registrar_acao_idempotente` antes de cada mutação real. Se a chave já foi
  processada (reenvio após queda de conexão no meio do envio), a função
  retorna `false` e a ação é apenas descartada da fila sem duplicar a escrita.
  Uma falha (ex.: sem conexão no meio da fila) para o processamento naquele
  item — a ordem é preservada para a próxima tentativa.
- `lib/categorias.ts` — cache local de categorias, necessário para criar
  lançamentos offline sem round-trip ao servidor.
- `hooks/useSincronizacao.ts` — dispara `processarFila` automaticamente ao
  detectar volta de conectividade (`@react-native-community/netinfo`) e expõe
  um botão manual "sincronizar agora" na tela.
- A listagem (`listarLancamentos`) mescla o último snapshot confirmado do
  servidor com as ações ainda pendentes na fila, marcando cada item pendente
  na UI.

Escopo desta primeira versão: cobre `lancamento_financeiro` (criar/excluir)
como prova do mecanismo. Resolução de conflito otimista
(`abrir_conflito_sincronizacao`/`marcar_conflito_resolvido`, para updates
concorrentes em entidades críticas) ainda não tem UI — hoje só o servidor
suporta o fluxo.

## O que já foi validado

- As 46 tabelas + a view `runway_atual` do schema aplicam sem erro.
- RLS habilitado em 100% das tabelas de `public`, nenhuma policy para `anon`.
- Login real (Supabase Auth) → Server Component do Next.js lê
  `categoria_financeira` com sucesso; usuária `anon` sem sessão recebe
  `permission denied` (42501), confirmando o isolamento single-user.
- Função `registrar_acao_idempotente` (idempotência da fila offline) e a
  view `runway_atual` (Finanças) testadas com dados reais.
- `pnpm --filter web build` e `tsc --noEmit` passam em web e mobile.
