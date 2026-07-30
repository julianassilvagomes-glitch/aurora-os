-- ============================================================
-- ESTUDOS — listas paralelas de Lei Seca e Doutrina
-- ============================================================
-- Cada disciplina mantém duas listas verticalizadas independentes
-- (Lei Seca e Doutrina), cada uma com sua própria numeração e
-- progresso. tipo_conteudo marca a qual lista um tópico pertence.

alter type categoria_estudo add value if not exists 'doutrina';

create type tipo_conteudo_topico as enum ('lei_seca', 'doutrina');

alter table topico_edital
  add column tipo_conteudo tipo_conteudo_topico not null default 'lei_seca';

alter table topico_edital alter column tipo_conteudo drop default;

-- Numeração estável dentro de cada lista (disciplina_id, tipo_conteudo).
-- O schema original não tinha coluna de ordem para os tópicos — os itens
-- eram só uma árvore via topico_pai_id, sem posição entre irmãos. A
-- verticalização numerada e o destaque de "próximo item" exigem uma
-- posição estável, então essa coluna é adicionada aqui.
alter table topico_edital
  add column ordem_na_lista int not null default 0;

create index idx_topico_lista on topico_edital(disciplina_id, tipo_conteudo, ordem_na_lista);
