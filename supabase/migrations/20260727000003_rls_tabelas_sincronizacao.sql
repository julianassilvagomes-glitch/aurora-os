-- ============================================================
-- CORREÇÃO — RLS para tabelas criadas após o loop automático
-- ============================================================
-- idempotencia_acao e conflito_sincronizacao são criadas na migration
-- anterior DEPOIS do loop "do $$ ... for tabela in pg_tables ...", então
-- não foram cobertas por ele. Sem isso, ficariam sem RLS habilitado,
-- quebrando a garantia "sem sessão válida, nenhuma linha é visível".

alter table public.idempotencia_acao enable row level security;
create policy idempotencia_acao_authenticated_full_access on public.idempotencia_acao
  for all to authenticated using (true) with check (true);

alter table public.conflito_sincronizacao enable row level security;
create policy conflito_sincronizacao_authenticated_full_access on public.conflito_sincronizacao
  for all to authenticated using (true) with check (true);
