-- ============================================================
-- GRANTS — privilégios de tabela para a role authenticated
-- ============================================================
-- RLS (migration 2) controla QUAIS linhas são visíveis, mas o Supabase
-- atual (auto_expose_new_tables=false por padrão) exige também o GRANT de
-- privilégio na tabela em si para cada role da Data API. Sem isso, o
-- PostgREST responde 42501 mesmo com uma policy "using (true)" correta.
-- Nenhum privilégio é concedido a "anon", propositalmente — mantém a
-- garantia "sem sessão válida, nenhum dado é acessível".

grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;
