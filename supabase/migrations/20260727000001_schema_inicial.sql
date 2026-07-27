-- ============================================================
-- AURORA OS — SCHEMA DE BANCO DE DADOS (PostgreSQL / Supabase)
-- ============================================================
-- Traduz os documentos de modelo de dados conceitual (Estudos, Trabalho,
-- Finanças, Rotinas, Saúde, Objetivos, Configurações) em tabelas reais.
--
-- Convenções:
--   - Toda tabela usa id uuid como chave primária (gen_random_uuid()).
--   - Entidades marcadas CRÍTICA (ver Política de Sincronização) têm
--     coluna updated_at mantida por trigger — usada pelo cliente para
--     detectar conflito. O backend NUNCA resolve essas entidades
--     automaticamente; a resolução é sempre manual (ver operação
--     resolverConflito no documento de Contratos de Dados).
--   - Enumerações (CHECK ou ENUM) espelham exatamente os domínios já
--     definidos nos documentos de modelo de dados — não foram inventados
--     valores novos aqui.
-- ============================================================

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create type modulo_sistema as enum (
  'estudos','trabalho','financas','saude','rotinas',
  'objetivos','relacionamentos','diario','biblioteca','arquivos','projetos'
);

-- ============================================================
-- MÓDULO: ARQUIVOS (suporte mínimo — referenciado por outros módulos)
-- ============================================================

create table documento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_arquivo text,
  caminho_armazenamento text not null, -- referência ao Supabase Storage
  data_importacao date not null default current_date
);

-- ============================================================
-- MÓDULO: CONFIGURAÇÕES
-- ============================================================

create type nivel_acesso_ia as enum ('acesso_total','acesso_mediante_confirmacao','sem_acesso');

-- CRÍTICA — risco de exposição de dados, nunca resolvida automaticamente
create table permissao_ia (
  id uuid primary key default gen_random_uuid(),
  modulo modulo_sistema not null unique,
  nivel_acesso nivel_acesso_ia not null default 'sem_acesso',
  updated_at timestamptz not null default now()
);
create trigger trg_permissao_ia_updated before update on permissao_ia
  for each row execute function set_updated_at();

create table preferencia_exibicao (
  id uuid primary key default gen_random_uuid(),
  tema text not null default 'automatico' check (tema in ('claro','escuro','automatico')),
  densidade_informacao text not null default 'confortavel' check (densidade_informacao in ('compacta','confortavel'))
);

create table padrao_formatacao (
  id uuid primary key default gen_random_uuid(),
  campo text not null unique,
  valor text not null
);

create table configuracao_notificacao (
  id uuid primary key default gen_random_uuid(),
  tipo_alerta text not null unique,
  antecedencia interval,
  ativo boolean not null default true,
  constraint chk_alerta_nunca_silenciavel check (
    tipo_alerta not in ('prazo_critico','conflito_sincronizacao') or ativo = true
  )
);

create table pilar_ativo (
  id uuid primary key default gen_random_uuid(),
  modulo modulo_sistema not null unique,
  ativo boolean not null default true,
  data_ativacao date not null default current_date
);

-- ============================================================
-- MÓDULO: OBJETIVOS
-- ============================================================

create type horizonte_meta as enum ('curto_prazo','medio_prazo','longo_prazo');
create type status_meta as enum ('em_andamento','atingida','abandonada');

-- CRÍTICA
create table meta (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  horizonte horizonte_meta not null,
  data_alvo date,
  status status_meta not null default 'em_andamento',
  confirmacao_manual boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint chk_meta_confirmacao check (status = 'em_andamento' or confirmacao_manual = true)
);
create trigger trg_meta_updated before update on meta
  for each row execute function set_updated_at();

create table sinal_progresso (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references meta(id) on delete cascade,
  modulo_origem modulo_sistema not null,
  data date not null default current_date,
  descricao text not null,
  indicador_valor numeric
);

-- ============================================================
-- MÓDULO: ESTUDOS
-- ============================================================

create type status_topico as enum ('nao_iniciado','em_estudo','revisado','consolidado');
create type categoria_estudo as enum ('lei_seca','jurisprudencia','questoes','revisao','redacao');
create type motivo_erro_questao as enum ('desconhecimento','pegadinha','interpretacao','distracao');
create type origem_conteudo as enum ('manual','gerado_por_ia');

create table disciplina (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  area text not null,
  peso_no_edital numeric,
  ordem_no_ciclo int not null,
  ativa boolean not null default true
);

create table topico_edital (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references disciplina(id) on delete restrict,
  topico_pai_id uuid references topico_edital(id) on delete cascade,
  titulo text not null,
  texto_original_edital text,
  status status_topico not null default 'nao_iniciado',
  incidencia text check (incidencia in ('alta','media','baixa')),
  contador_revisoes int not null default 0,
  data_ultima_revisao date,
  proxima_revisao_sugerida date,
  updated_at timestamptz not null default now(),
  -- regra completa de "consolidado" (3+ revisões OU 80%+ de acerto em 10+ questões)
  -- é validada na operação calcularCoberturaEdital, camada de aplicação
  constraint chk_topico_consolidado check (status <> 'consolidado' or contador_revisoes >= 3)
);
create trigger trg_topico_updated before update on topico_edital
  for each row execute function set_updated_at();

create table bloco_cronograma (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  disciplina_id uuid not null references disciplina(id),
  topico_id uuid references topico_edital(id),
  categoria categoria_estudo not null,
  duracao_planejada_min int not null,
  status text not null default 'planejado' check (status in ('planejado','realocado','concluido','perdido')),
  motivo_realocacao text,
  bloco_origem_id uuid references bloco_cronograma(id)
);

create table sessao_estudo (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid references bloco_cronograma(id),
  topico_id uuid not null references topico_edital(id),
  categoria categoria_estudo not null,
  inicio timestamptz not null,
  fim timestamptz not null,
  observacoes text
);

create table documento_pdf (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null check (tipo in ('doutrina','lei','jurisprudencia','resumo_proprio','questoes')),
  topico_id uuid references topico_edital(id),
  arquivo_ref uuid not null references documento(id),
  paginas_relevantes text,
  data_importacao date not null default current_date
);

create table questao (
  id uuid primary key default gen_random_uuid(),
  topico_id uuid not null references topico_edital(id),
  enunciado text not null,
  gabarito text not null,
  banca text,
  ano int,
  origem_pdf_id uuid references documento_pdf(id)
);

create table resposta_questao (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null references questao(id) on delete cascade,
  data date not null default current_date,
  acertou boolean not null,
  motivo_erro motivo_erro_questao,
  tempo_gasto_seg int,
  constraint chk_motivo_erro_obrigatorio check (acertou = true or motivo_erro is not null)
);

create table flashcard (
  id uuid primary key default gen_random_uuid(),
  topico_id uuid not null references topico_edital(id),
  frente text not null,
  verso text not null,
  origem origem_conteudo not null default 'manual',
  ativo boolean not null default true,
  intervalo_atual_dias int not null default 1,
  fator_facilidade numeric not null default 2.5,
  proxima_revisao date not null default current_date
  -- regra "ativo só true após confirmação humana quando origem = gerado_por_ia"
  -- é aplicada pela operação ativarConteudoGeradoPorIA, nunca no insert direto
);

create table revisao_flashcard (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references flashcard(id) on delete cascade,
  data date not null default current_date,
  qualidade_resposta int not null check (qualidade_resposta between 0 and 5),
  novo_intervalo_dias int not null
);

create table interacao_ia_estudos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('geracao_questao','explicacao_conceito','resumo','geracao_flashcard')),
  topico_id uuid references topico_edital(id),
  prompt_enviado text not null,
  resposta_recebida text not null,
  data timestamptz not null default now(),
  avaliacao_usuario text check (avaliacao_usuario in ('util','nao_util','nao_avaliado')),
  gerou_flashcard_id uuid references flashcard(id)
);

-- ============================================================
-- MÓDULO: TRABALHO
-- (mantido no schema porque Rotinas referencia Prazo/Audiência
-- pela chave polimórfica de BlocoTempo — ver seção Rotinas)
-- ============================================================

create table processo (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  orgao text not null check (orgao in ('gabinete_tjma','defensoria','stj')),
  classe text not null,
  camara_relator text,
  tese_central text,
  status text not null default 'em_analise' check (status in
    ('em_analise','minuta_em_elaboracao','revisao','concluido','aguardando_publicacao')),
  origem_comarca text,
  updated_at timestamptz not null default now()
);
create trigger trg_processo_updated before update on processo
  for each row execute function set_updated_at();

create table parte (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('parte_assistida','reu','autor','terceiro_interessado')),
  documento text,
  contato text
);

create table processo_parte (
  processo_id uuid not null references processo(id) on delete cascade,
  parte_id uuid not null references parte(id) on delete cascade,
  papel_no_processo text not null check (papel_no_processo in ('assistido','contrario','terceiro')),
  primary key (processo_id, parte_id)
);

-- CRÍTICA
create table prazo (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processo(id) on delete cascade,
  tipo text not null check (tipo in ('fatal','organizacao_interna')),
  data_limite date not null,
  descricao text not null,
  status text not null default 'aberto' check (status in ('aberto','protocolado','perdido')),
  confirmacao_protocolo boolean not null default false,
  data_confirmacao date,
  updated_at timestamptz not null default now(),
  constraint chk_prazo_fatal_protocolado check (
    tipo <> 'fatal' or status <> 'protocolado' or confirmacao_protocolo = true
  )
);
create trigger trg_prazo_updated before update on prazo
  for each row execute function set_updated_at();

-- CRÍTICA (correção incorporada na Política de Sincronização)
create table audiencia (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processo(id) on delete cascade,
  data_hora timestamptz not null,
  tipo text not null check (tipo in ('instrucao','julgamento','conciliacao','cejusc')),
  local_ou_link text,
  status text not null default 'agendada' check (status in ('agendada','realizada','cancelada','adiada')),
  observacoes_pos text,
  updated_at timestamptz not null default now()
);
create trigger trg_audiencia_updated before update on audiencia
  for each row execute function set_updated_at();

create table documento_processual (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processo(id) on delete cascade,
  identificador_num text not null check (identificador_num ~ '^Num\.'),
  pagina text,
  tipo text not null check (tipo in ('peticao','decisao','parecer','prova','minuta')),
  descricao text
);

create table modelo_minuta (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_peca text not null check (tipo_peca in ('voto','decisao_monocratica','acordao')),
  classe_aplicavel text,
  estrutura_secoes text[] not null
);

create table jurisprudencia_verificada (
  id uuid primary key default gen_random_uuid(),
  tema_tag text not null,
  ementa_resumida text not null,
  tribunal text not null,
  numero_julgado text not null,
  data_verificacao date not null,
  link_conferencia text not null,
  -- origem nunca aceita valor derivado de peça das partes — domínio fechado
  origem text not null default 'pesquisa_independente' check (origem = 'pesquisa_independente'),
  status text not null default 'ativa' check (status in ('ativa','desatualizada'))
);

create table inconsistencia_sinalizada (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processo(id) on delete cascade,
  tipo text not null check (tipo in ('vicio_representacao','cerceamento_defesa','contradicao_interna','outro')),
  descricao text not null,
  status text not null default 'sinalizada' check (status in ('sinalizada','resolvida','aguardando_decisao'))
);

create table interacao_ia_juridica (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid references processo(id),
  tipo_assistencia text not null check (tipo_assistencia in
    ('pesquisa_jurisprudencia','revisao_minuta','sugestao_estrutural','verificacao_checklist')),
  prompt_enviado text not null,
  resposta_recebida text not null,
  data timestamptz not null default now(),
  revisao_humana_confirmada boolean not null default false
);

create table checklist_fechamento (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processo(id) on delete cascade,
  itens jsonb not null default '[]', -- [{descricao, status}]
  data_fechamento date,
  aprovado boolean not null default false
  -- "aprovado" só vira true pela aplicação, quando todo item de "itens" está concluído
);

-- ============================================================
-- MÓDULO: FINANÇAS
-- ============================================================

create table categoria_financeira (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  grupo text not null check (grupo in ('fixo','variavel','estudo','trabalho','pessoal')),
  ativa boolean not null default true
);

create table lancamento_financeiro (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receita','despesa')),
  valor numeric(12,2) not null check (valor > 0),
  data date not null default current_date,
  categoria_id uuid not null references categoria_financeira(id),
  descricao text,
  recorrente boolean not null default false,
  origem_modulo modulo_sistema
);

-- CRÍTICA
create table meta_financeira (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('reserva_minima','reducao_despesa','aumento_receita')),
  valor_alvo numeric(12,2),
  prazo date,
  status text not null default 'em_andamento' check (status in ('em_andamento','atingida')),
  confirmacao_manual boolean not null default false,
  meta_vida_ref uuid references meta(id),
  updated_at timestamptz not null default now(),
  constraint chk_meta_financeira_confirmacao check (status = 'em_andamento' or confirmacao_manual = true)
);
create trigger trg_meta_financeira_updated before update on meta_financeira
  for each row execute function set_updated_at();

create table simulacao_cenario (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  parametro_reducao_renda numeric,
  parametro_periodo_meses int not null,
  parametro_aumento_despesa numeric,
  resultado_runway_hipotetico numeric not null,
  data_criacao timestamptz not null default now(),
  hipotetico boolean not null default true check (hipotetico = true)
);

-- runway_atual: view derivada, nunca gravável — o cálculo completo de
-- tendência (subindo/estável/caindo) fica na operação calcularRunwayAtual
create view runway_atual as
select
  coalesce(sum(case when tipo = 'receita' then valor else -valor end), 0) as saldo_atual,
  coalesce((
    select avg(total_mes) from (
      select date_trunc('month', data) as mes, sum(valor) as total_mes
      from lancamento_financeiro
      where tipo = 'despesa' and data >= current_date - interval '3 months'
      group by 1
    ) t
  ), 0) as media_despesas_3_meses
from lancamento_financeiro;

-- ============================================================
-- MÓDULO: ROTINAS (Agenda + Hábitos)
-- ============================================================

create type tipo_origem_bloco as enum ('trabalho','estudos','habito','saude','pessoal','manual');
create type status_bloco as enum ('planejado','em_andamento','concluido','perdido','cancelado');

create table bloco_tempo (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  titulo text not null,
  tipo_origem tipo_origem_bloco not null,
  -- referência polimórfica: interpretada pela aplicação conforme tipo_origem
  -- (aponta para prazo.id, audiencia.id, bloco_cronograma.id, sessao_estudo.id
  -- ou habito.id; nulo quando tipo_origem = 'manual')
  entidade_origem_id uuid,
  status status_bloco not null default 'planejado',
  bloco_origem_realocacao_id uuid references bloco_tempo(id),
  criado_por text not null check (criado_por in ('usuario','sistema'))
);

create table conflito_agenda (
  id uuid primary key default gen_random_uuid(),
  bloco_a_id uuid not null references bloco_tempo(id) on delete cascade,
  bloco_b_id uuid not null references bloco_tempo(id) on delete cascade,
  data_detectado timestamptz not null default now(),
  resolvido boolean not null default false
);

create table evento_recorrente (
  id uuid primary key default gen_random_uuid(),
  regra_recorrencia text not null, -- padrão tipo RRULE
  titulo_modelo text not null,
  ativa boolean not null default true,
  gera_blocos_ate date
);

create table habito (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text check (categoria in ('saude','estudo','organizacao','relacionamento','outro')),
  frequencia text not null check (frequencia in ('diaria','dias_especificos','n_vezes_semana')),
  dias_da_semana int[],
  horario_fixo time,
  ativo boolean not null default true,
  data_criacao date not null default current_date,
  meta_vida_ref uuid references meta(id)
);

create table registro_habito (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references habito(id) on delete cascade,
  data date not null,
  concluido boolean not null default true,
  hora_registro timestamptz,
  observacao text,
  unique (habito_id, data)
);

-- ============================================================
-- MÓDULO: SAÚDE
-- ============================================================

create table registro_corporal (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  peso_kg numeric(5,2) not null,
  observacao text
);

create table registro_exercicio (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  tipo text not null check (tipo in ('cardio','forca','alongamento','outro')),
  duracao_min int not null,
  intensidade_percebida text check (intensidade_percebida in ('baixa','media','alta'))
);

create table registro_agua (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  quantidade_ml int not null,
  hora_registro time
);

create table registro_sono (
  id uuid primary key default gen_random_uuid(),
  data_referencia date not null,
  hora_dormir time not null,
  hora_acordar time not null,
  qualidade_percebida text check (qualidade_percebida in ('ruim','regular','boa','otima'))
);

-- corresponde à entidade núcleo "Estado" da arquitetura geral
create table registro_humor (
  id uuid primary key default gen_random_uuid(),
  data_hora timestamptz not null default now(),
  humor int not null check (humor between 1 and 5),
  energia int check (energia between 1 and 5),
  nota text
);

-- CRÍTICA
create table consulta_exame (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('consulta','exame')),
  especialidade_ou_nome text not null,
  data_hora timestamptz not null,
  local text,
  status text not null default 'agendado' check (status in ('agendado','realizado','cancelado','adiado')),
  resultado_arquivo_id uuid references documento(id),
  observacoes text,
  updated_at timestamptz not null default now()
);
create trigger trg_consulta_exame_updated before update on consulta_exame
  for each row execute function set_updated_at();

-- CRÍTICA
create table medicamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  dose text not null,
  frequencia_horario text not null,
  data_inicio date not null,
  data_fim date,
  ativo boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger trg_medicamento_updated before update on medicamento
  for each row execute function set_updated_at();

create table registro_medicamento (
  id uuid primary key default gen_random_uuid(),
  medicamento_id uuid not null references medicamento(id) on delete cascade,
  data_hora timestamptz not null default now(),
  tomado boolean not null default true
);

-- ============================================================
-- ÍNDICES DE APOIO (consultas mais frequentes do dia a dia)
-- ============================================================

create index idx_prazo_data_limite on prazo(data_limite) where status = 'aberto';
create index idx_audiencia_data on audiencia(data_hora) where status = 'agendada';
create index idx_bloco_tempo_data on bloco_tempo(data);
create index idx_registro_habito_data on registro_habito(data);
create index idx_lancamento_data on lancamento_financeiro(data);
create index idx_topico_status on topico_edital(status);
create index idx_flashcard_proxima_revisao on flashcard(proxima_revisao) where ativo = true;
create index idx_consulta_exame_data on consulta_exame(data_hora) where status = 'agendado';

-- ============================================================
-- NOTA SOBRE SEGURANÇA (RLS)
-- ============================================================
-- Como o Aurora OS é single-user, Row Level Security pode ser tão simples
-- quanto uma política única por tabela vinculando auth.uid() ao dono dos
-- dados (coluna user_id, omitida acima por simplicidade — adicionar antes
-- de habilitar RLS em produção). Não há necessidade de políticas por papel
-- ou por equipe, coerente com a decisão de autenticação simplificada já
-- registrada na Arquitetura Técnica Multiplataforma.
