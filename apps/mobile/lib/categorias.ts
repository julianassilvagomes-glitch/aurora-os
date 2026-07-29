import { supabase } from "./supabase";
import { readJson, writeJson } from "./storage";

const CATEGORIAS_KEY = "aurora:categorias";

export type Categoria = { id: string; nome: string; grupo: string };

export async function categoriasEmCache(): Promise<Categoria[]> {
  return readJson<Categoria[]>(CATEGORIAS_KEY, []);
}

/** Busca categorias do servidor e atualiza o cache local (usado para criar lançamentos offline). */
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
