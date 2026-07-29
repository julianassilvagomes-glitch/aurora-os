import { supabase } from "./supabase";
import { readJson, writeJson } from "./storage";

const CATEGORIAS_KEY = "aurora:categorias";

export type Categoria = { id: string; nome: string; grupo: string };
export type CategoriaGerenciavel = Categoria & { ativa: boolean; temLancamentos: boolean };

export async function categoriasEmCache(): Promise<Categoria[]> {
  return readJson<Categoria[]>(CATEGORIAS_KEY, []);
}

/** Busca categorias ativas do servidor e atualiza o cache local (usado para criar lançamentos offline). */
export async function atualizarCategoriasCache(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categoria_financeira")
    .select("id, nome, grupo")
    .eq("ativa", true)
    .order("nome");

  if (error || !data) return categoriasEmCache();

  await writeJson(CATEGORIAS_KEY, data);
  return data;
}

/**
 * Gestão de categorias (criar/editar/excluir) é só-online, diferente do
 * outbox de lançamentos: não é uma operação de uso diário offline, e
 * evita duplicar o mecanismo de idempotência para uma segunda entidade.
 */
export async function listarCategoriasGerenciaveis(): Promise<CategoriaGerenciavel[]> {
  const { data, error } = await supabase
    .from("categoria_financeira")
    .select("id, nome, grupo, ativa, lancamento_financeiro(count)")
    .order("nome");

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    nome: c.nome,
    grupo: c.grupo,
    ativa: c.ativa,
    temLancamentos: (c.lancamento_financeiro?.[0]?.count ?? 0) > 0,
  }));
}

export async function criarCategoria(nome: string, grupo: string): Promise<string | null> {
  const { error } = await supabase.from("categoria_financeira").insert({ nome, grupo });
  return error?.message ?? null;
}

export async function editarCategoria(
  id: string,
  nome: string,
  grupo: string
): Promise<string | null> {
  const { error } = await supabase
    .from("categoria_financeira")
    .update({ nome, grupo })
    .eq("id", id);
  return error?.message ?? null;
}

/** Exclui de verdade só se não houver lançamento vinculado; senão, desativa. */
export async function removerOuDesativarCategoria(id: string): Promise<string | null> {
  const { count, error: erroContagem } = await supabase
    .from("lancamento_financeiro")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", id);
  if (erroContagem) return erroContagem.message;

  if (count && count > 0) {
    const { error } = await supabase
      .from("categoria_financeira")
      .update({ ativa: false })
      .eq("id", id);
    return error?.message ?? null;
  }

  const { error } = await supabase.from("categoria_financeira").delete().eq("id", id);
  return error?.message ?? null;
}

export async function reativarCategoria(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("categoria_financeira")
    .update({ ativa: true })
    .eq("id", id);
  return error?.message ?? null;
}
