"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

export async function criarLancamento(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const tipo = formData.get("tipo");
  const valor = formData.get("valor");
  const data = formData.get("data");
  const categoria_id = formData.get("categoria_id");
  const descricao = formData.get("descricao");
  const recorrente = formData.get("recorrente") === "on";

  if (tipo !== "receita" && tipo !== "despesa") {
    return { error: "Tipo inválido." };
  }
  if (!categoria_id || typeof categoria_id !== "string") {
    return { error: "Selecione uma categoria." };
  }
  const valorNumerico = Number(valor);
  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    return { error: "Valor inválido." };
  }

  const { error } = await supabase.from("lancamento_financeiro").insert({
    tipo,
    valor: valorNumerico,
    data: typeof data === "string" && data ? data : undefined,
    categoria_id,
    descricao: typeof descricao === "string" && descricao ? descricao : null,
    recorrente,
  });

  if (error) return { error: error.message };

  revalidatePath("/financas");
  return { error: null };
}

export async function excluirLancamento(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("lancamento_financeiro")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/financas");
}

export async function criarCategoria(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const nome = formData.get("nome");
  const grupo = formData.get("grupo");
  const gruposValidos = ["fixo", "variavel", "estudo", "trabalho", "pessoal"];

  if (typeof nome !== "string" || !nome.trim()) {
    return { error: "Informe o nome da categoria." };
  }
  if (typeof grupo !== "string" || !gruposValidos.includes(grupo)) {
    return { error: "Grupo inválido." };
  }

  const { error } = await supabase
    .from("categoria_financeira")
    .insert({ nome: nome.trim(), grupo });

  if (error) return { error: error.message };

  revalidatePath("/financas");
  return { error: null };
}

export async function editarCategoria(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const id = formData.get("id");
  const nome = formData.get("nome");
  const grupo = formData.get("grupo");
  const gruposValidos = ["fixo", "variavel", "estudo", "trabalho", "pessoal"];

  if (typeof id !== "string" || !id) return { error: "Categoria inválida." };
  if (typeof nome !== "string" || !nome.trim()) {
    return { error: "Informe o nome da categoria." };
  }
  if (typeof grupo !== "string" || !gruposValidos.includes(grupo)) {
    return { error: "Grupo inválido." };
  }

  const { error } = await supabase
    .from("categoria_financeira")
    .update({ nome: nome.trim(), grupo })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/financas");
  return { error: null };
}

/**
 * Exclui a categoria de verdade só se nenhum lançamento a referencia —
 * caso contrário, apenas desativa (ativa = false), preservando o
 * histórico. Reativar é sempre possível.
 */
export async function removerOuDesativarCategoria(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { count, error: erroContagem } = await supabase
    .from("lancamento_financeiro")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", id);
  if (erroContagem) throw new Error(erroContagem.message);

  if (count && count > 0) {
    const { error } = await supabase
      .from("categoria_financeira")
      .update({ ativa: false })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("categoria_financeira")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/financas");
}

export async function reativarCategoria(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("categoria_financeira")
    .update({ ativa: true })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/financas");
}
