"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@aurora/shared";
import { calcularProximaRevisao, QUALIDADE_POR_BOTAO, type BotaoRevisao } from "@aurora/shared";

export type ActionState = { error: string | null };

type StatusTopico = Database["public"]["Enums"]["status_topico"];
type CategoriaEstudo = Database["public"]["Enums"]["categoria_estudo"];
type MotivoErro = Database["public"]["Enums"]["motivo_erro_questao"];

async function usuarioAutenticado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return supabase;
}

// ---------------------------------------------------------------------------
// Disciplinas e tópicos (edital verticalizado)
// ---------------------------------------------------------------------------

export async function criarDisciplina(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await usuarioAutenticado();

  const nome = formData.get("nome");
  const area = formData.get("area");
  const ordem = Number(formData.get("ordem_no_ciclo"));

  if (typeof nome !== "string" || !nome.trim()) return { error: "Informe o nome." };
  if (typeof area !== "string" || !area.trim()) return { error: "Informe a área." };
  if (!Number.isFinite(ordem) || ordem < 1) {
    return { error: "Ordem no ciclo precisa ser um número maior que zero." };
  }

  const { error } = await supabase
    .from("disciplina")
    .insert({ nome: nome.trim(), area: area.trim(), ordem_no_ciclo: ordem });
  if (error) return { error: error.message };

  revalidatePath("/estudos");
  return { error: null };
}

export async function criarTopico(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await usuarioAutenticado();

  const disciplina_id = formData.get("disciplina_id");
  const topico_pai_id = formData.get("topico_pai_id");
  const titulo = formData.get("titulo");
  const incidencia = formData.get("incidencia");

  if (typeof disciplina_id !== "string" || !disciplina_id) {
    return { error: "Selecione a disciplina." };
  }
  if (typeof titulo !== "string" || !titulo.trim()) {
    return { error: "Informe o título do tópico." };
  }

  const { error } = await supabase.from("topico_edital").insert({
    disciplina_id,
    topico_pai_id: typeof topico_pai_id === "string" && topico_pai_id ? topico_pai_id : null,
    titulo: titulo.trim(),
    incidencia:
      typeof incidencia === "string" && incidencia ? incidencia : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/estudos");
  return { error: null };
}

/**
 * "Consolidado" exige contador_revisoes >= 3 (constraint do banco). Cada
 * transição PARA "revisado" conta como uma revisão. A regra alternativa de
 * consolidação (80%+ de acerto em 10+ questões) não altera este campo — ela
 * só entra no cálculo de cobertura (calcularCobertura), como já documentado
 * na migration.
 */
export async function atualizarStatusTopico(id: string, novoStatus: StatusTopico) {
  const supabase = await usuarioAutenticado();

  const { data: topico, error: erroLeitura } = await supabase
    .from("topico_edital")
    .select("contador_revisoes")
    .eq("id", id)
    .single();
  if (erroLeitura) throw new Error(erroLeitura.message);

  if (novoStatus === "consolidado" && topico.contador_revisoes < 3) {
    throw new Error("Só é possível consolidar após 3 revisões.");
  }

  const patch: Database["public"]["Tables"]["topico_edital"]["Update"] = {
    status: novoStatus,
  };
  if (novoStatus === "revisado") {
    patch.contador_revisoes = topico.contador_revisoes + 1;
    patch.data_ultima_revisao = new Date().toISOString().slice(0, 10);
    const proxima = new Date();
    proxima.setDate(proxima.getDate() + 7);
    patch.proxima_revisao_sugerida = proxima.toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("topico_edital").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/estudos");
}

// ---------------------------------------------------------------------------
// Cronograma de estudo
// ---------------------------------------------------------------------------

export async function criarBlocoCronograma(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await usuarioAutenticado();

  const data = formData.get("data");
  const disciplina_id = formData.get("disciplina_id");
  const topico_id = formData.get("topico_id");
  const categoria = formData.get("categoria");
  const duracao = Number(formData.get("duracao_planejada_min"));

  if (typeof data !== "string" || !data) return { error: "Informe a data." };
  if (typeof disciplina_id !== "string" || !disciplina_id) {
    return { error: "Selecione a disciplina." };
  }
  if (typeof categoria !== "string" || !categoria) {
    return { error: "Selecione a categoria do bloco." };
  }
  if (!Number.isFinite(duracao) || duracao <= 0) {
    return { error: "Duração inválida." };
  }

  const { error } = await supabase.from("bloco_cronograma").insert({
    data,
    disciplina_id,
    topico_id: typeof topico_id === "string" && topico_id ? topico_id : null,
    categoria: categoria as CategoriaEstudo,
    duracao_planejada_min: duracao,
  });
  if (error) return { error: error.message };

  revalidatePath("/estudos");
  return { error: null };
}

export async function marcarBlocoStatus(id: string, status: "concluido" | "perdido") {
  const supabase = await usuarioAutenticado();
  const { error } = await supabase.from("bloco_cronograma").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/estudos");
}

/**
 * Realoca um bloco perdido sem apagar histórico: o bloco original vira
 * status "realocado" (preservado), e um bloco novo é criado apontando pra
 * ele via bloco_origem_id — mesmo padrão de BlocoTempo/realocação no
 * módulo de Rotinas.
 */
export async function realocarBloco(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await usuarioAutenticado();

  const blocoId = formData.get("bloco_id");
  const novaData = formData.get("nova_data");
  const motivo = formData.get("motivo");

  if (typeof blocoId !== "string" || !blocoId) return { error: "Bloco inválido." };
  if (typeof novaData !== "string" || !novaData) return { error: "Informe a nova data." };

  const { data: original, error: erroLeitura } = await supabase
    .from("bloco_cronograma")
    .select("disciplina_id, topico_id, categoria, duracao_planejada_min")
    .eq("id", blocoId)
    .single();
  if (erroLeitura) return { error: erroLeitura.message };

  const { error: erroNovo } = await supabase.from("bloco_cronograma").insert({
    data: novaData,
    disciplina_id: original.disciplina_id,
    topico_id: original.topico_id,
    categoria: original.categoria,
    duracao_planejada_min: original.duracao_planejada_min,
    bloco_origem_id: blocoId,
  });
  if (erroNovo) return { error: erroNovo.message };

  const { error: erroAtualiza } = await supabase
    .from("bloco_cronograma")
    .update({
      status: "realocado",
      motivo_realocacao: typeof motivo === "string" && motivo ? motivo : null,
    })
    .eq("id", blocoId);
  if (erroAtualiza) return { error: erroAtualiza.message };

  revalidatePath("/estudos");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Banco de questões
// ---------------------------------------------------------------------------

export async function criarQuestao(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await usuarioAutenticado();

  const topico_id = formData.get("topico_id");
  const enunciado = formData.get("enunciado");
  const gabarito = formData.get("gabarito");
  const banca = formData.get("banca");
  const ano = formData.get("ano");

  if (typeof topico_id !== "string" || !topico_id) return { error: "Selecione o tópico." };
  if (typeof enunciado !== "string" || !enunciado.trim()) {
    return { error: "Informe o enunciado." };
  }
  if (typeof gabarito !== "string" || !gabarito.trim()) {
    return { error: "Informe o gabarito." };
  }

  const { error } = await supabase.from("questao").insert({
    topico_id,
    enunciado: enunciado.trim(),
    gabarito: gabarito.trim(),
    banca: typeof banca === "string" && banca ? banca : null,
    ano: typeof ano === "string" && ano ? Number(ano) : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/estudos");
  return { error: null };
}

/** motivo_erro é obrigatório quando acertou = false — regra chk_motivo_erro_obrigatorio do schema. */
export async function responderQuestao(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await usuarioAutenticado();

  const questao_id = formData.get("questao_id");
  const acertou = formData.get("acertou") === "true";
  const motivo_erro = formData.get("motivo_erro");
  const tempo = formData.get("tempo_gasto_seg");

  if (typeof questao_id !== "string" || !questao_id) return { error: "Questão inválida." };
  if (!acertou && (typeof motivo_erro !== "string" || !motivo_erro)) {
    return { error: "Selecione o motivo do erro." };
  }

  const { error } = await supabase.from("resposta_questao").insert({
    questao_id,
    acertou,
    motivo_erro: acertou ? null : (motivo_erro as MotivoErro),
    tempo_gasto_seg:
      typeof tempo === "string" && tempo ? Number(tempo) : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/estudos");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Flashcards com revisão espaçada (SM-2 simplificado)
// ---------------------------------------------------------------------------

export async function criarFlashcard(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await usuarioAutenticado();

  const topico_id = formData.get("topico_id");
  const frente = formData.get("frente");
  const verso = formData.get("verso");

  if (typeof topico_id !== "string" || !topico_id) return { error: "Selecione o tópico." };
  if (typeof frente !== "string" || !frente.trim()) return { error: "Informe a frente." };
  if (typeof verso !== "string" || !verso.trim()) return { error: "Informe o verso." };

  const { error } = await supabase.from("flashcard").insert({
    topico_id,
    frente: frente.trim(),
    verso: verso.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath("/estudos");
  return { error: null };
}

export type { BotaoRevisao };

export async function revisarFlashcard(flashcardId: string, botao: BotaoRevisao) {
  const supabase = await usuarioAutenticado();

  const { data: flashcard, error: erroLeitura } = await supabase
    .from("flashcard")
    .select("intervalo_atual_dias, fator_facilidade")
    .eq("id", flashcardId)
    .single();
  if (erroLeitura) throw new Error(erroLeitura.message);

  const qualidade = QUALIDADE_POR_BOTAO[botao];
  const { novoIntervalo, novoFator } = calcularProximaRevisao(
    qualidade,
    flashcard.intervalo_atual_dias,
    flashcard.fator_facilidade
  );

  const proximaData = new Date();
  proximaData.setDate(proximaData.getDate() + novoIntervalo);
  const proximaRevisaoStr = proximaData.toISOString().slice(0, 10);

  const { error: erroUpdate } = await supabase
    .from("flashcard")
    .update({
      intervalo_atual_dias: novoIntervalo,
      fator_facilidade: novoFator,
      proxima_revisao: proximaRevisaoStr,
    })
    .eq("id", flashcardId);
  if (erroUpdate) throw new Error(erroUpdate.message);

  const { error: erroRevisao } = await supabase.from("revisao_flashcard").insert({
    flashcard_id: flashcardId,
    qualidade_resposta: qualidade,
    novo_intervalo_dias: novoIntervalo,
  });
  if (erroRevisao) throw new Error(erroRevisao.message);

  revalidatePath("/estudos");
}
