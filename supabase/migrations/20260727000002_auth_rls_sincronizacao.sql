-- ============================================================
-- AURORA OS — AUTENTICAÇÃO, RLS E SUPORTE DE SINCRONIZAÇÃO
-- Passos 3 e 4 da sequência de implementação (documento mestre)
-- ============================================================

-- ============================================================
-- PASSO 3 — AUTENTICAÇÃO SINGLE-USER
-- ============================================================
-- Aurora OS tem exatamente uma usuária. Isso simplifica a autenticação
-- em duas decisões concretas:
--   1. Nenhum fluxo de convite, papel ou permissão multiusuário.
--   2. RLS não precisa de coluna user_id em cada linha — a política é
--      "qualquer usuária autenticada tem acesso total", porque só existe
--      uma. Isso evita dezenas de ALTER TABLE só para guardar um dado
--      que nunca varia.

-- Criação da única conta (executar uma vez, via Supabase Studio ou CLI —
-- nunca versionar a senha em texto neste arquivo):
--   supabase.auth.admin.createUser({ email, password, email_confirm: true })

-- Configuração recomendada no painel do Supabase (Authentication > Settings):
--   - Desabilitar "Allow new users to sign up" — impede que qualquer
--     outra conta seja criada, mesmo que alguém descubra a URL do projeto.
--   - Habilitar apenas o provedor de e-mail/senha (sem OAuth social,
--     desnecessário para um sistema de uma pessoa só).
--   - Sessão longa (ex.: 30 dias) com refresh automático, já que o app
--     mobile precisa continuar autenticado em uso diário sem fricção.

-- ============================================================
-- ROW LEVEL SECURITY — política única "autenticado = acesso total"
-- ============================================================

do $$
declare
  tabela text;
begin
  for tabela in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', tabela);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true);',
      tabela || '_authenticated_full_access', tabela
    );
  end loop;
end $$;

-- Nenhuma policy é criada para o papel "anon" — sem sessão válida,
-- nenhuma linha de nenhuma tabela é visível ou editável. Isso é o
-- equivalente, em dados, ao valor padrão "sem acesso" já definido
-- para permissao_ia em Configurações: acesso nunca é o padrão.

-- ============================================================
-- PASSO 4 — CAMADA DE SINCRONIZAÇÃO E OFFLINE (suporte de servidor)
-- ============================================================
-- Este bloco cobre apenas a metade "servidor" do mecanismo descrito na
-- Política de Sincronização. A fila local (outbox) e os identificadores
-- temporários vivem no cliente (ver documento
-- "Camada Offline — Cliente"). Aqui ficam as duas peças que o servidor
-- precisa para sustentar aquele mecanismo: idempotência e registro de
-- conflito.

-- Idempotência: evita duplicata quando uma ação da fila offline é
-- reenviada (ex.: conexão caiu no meio do envio).
create table idempotencia_acao (
  chave text primary key,          -- gerada no cliente, no momento da criação da ação
  entidade text not null,          -- nome da tabela afetada
  operacao text not null check (operacao in ('criar','atualizar','excluir')),
  processado_em timestamptz not null default now()
);

create or replace function registrar_acao_idempotente(
  p_chave text, p_entidade text, p_operacao text
) returns boolean as $$
declare
  linhas_inseridas int;
begin
  insert into idempotencia_acao (chave, entidade, operacao)
  values (p_chave, p_entidade, p_operacao)
  on conflict (chave) do nothing;
  get diagnostics linhas_inseridas = row_count;
  return linhas_inseridas > 0; -- true = ação nova (processar); false = duplicata (ignorar)
end;
$$ language plpgsql;

-- Conflito de sincronização: generaliza conflito_agenda (já existente,
-- específico de BlocoTempo) para qualquer entidade crítica da taxonomia
-- definida na Política de Sincronização.
create table conflito_sincronizacao (
  id uuid primary key default gen_random_uuid(),
  entidade text not null,               -- nome da tabela (ex.: 'prazo', 'permissao_ia')
  entidade_id uuid not null,
  versao_dispositivo_a jsonb not null,
  versao_dispositivo_b jsonb not null,
  origem_a text,                        -- rótulo amigável, ex.: "celular — 14:32"
  origem_b text,                        -- ex.: "computador — 14:35"
  data_detectado timestamptz not null default now(),
  resolvido boolean not null default false,
  resolvido_em timestamptz,
  versao_final jsonb                    -- preenchida quando resolvido = true
);

create index idx_conflito_pendente on conflito_sincronizacao(resolvido) where resolvido = false;

-- ============================================================
-- Controle de concorrência otimista para entidades CRÍTICAS
-- ============================================================
-- Em vez de um trigger que decide sozinho, o controle de conflito usa
-- concorrência otimista: toda atualização em uma tabela crítica
-- (prazo, audiencia, meta, meta_financeira, permissao_ia, medicamento,
-- consulta_exame) DEVE incluir na cláusula WHERE o updated_at que o
-- cliente leu por último:
--
--   update prazo
--   set status = 'protocolado', confirmacao_protocolo = true
--   where id = :id and updated_at = :ultimo_updated_at_conhecido;
--
-- Se a atualização afetar 0 linhas, o cliente sabe que outro dispositivo
-- alterou a linha entre a leitura e a escrita — nesse momento, e só
-- nesse momento, ele chama a função abaixo para abrir um conflito visível,
-- em vez de tentar de novo silenciosamente.

create or replace function abrir_conflito_sincronizacao(
  p_entidade text,
  p_entidade_id uuid,
  p_versao_dispositivo_a jsonb,
  p_versao_dispositivo_b jsonb,
  p_origem_a text,
  p_origem_b text
) returns uuid as $$
declare
  novo_id uuid;
begin
  insert into conflito_sincronizacao
    (entidade, entidade_id, versao_dispositivo_a, versao_dispositivo_b, origem_a, origem_b)
  values
    (p_entidade, p_entidade_id, p_versao_dispositivo_a, p_versao_dispositivo_b, p_origem_a, p_origem_b)
  returning id into novo_id;
  return novo_id;
end;
$$ language plpgsql;

-- Resolução manual (chamada pela tela "Resolução de conflito", 2.8 do
-- Inventário de Telas, ou pela operação resolverConflito dos Contratos
-- de Dados). Aplica a versão final na tabela de origem é responsabilidade
-- da camada de aplicação, porque o nome da tabela e das colunas varia por
-- entidade — esta função só fecha o registro do conflito em si.
create or replace function marcar_conflito_resolvido(
  p_conflito_id uuid, p_versao_final jsonb
) returns void as $$
begin
  update conflito_sincronizacao
  set resolvido = true, resolvido_em = now(), versao_final = p_versao_final
  where id = p_conflito_id;
end;
$$ language plpgsql;
