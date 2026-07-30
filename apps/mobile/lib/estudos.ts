import { supabase } from "./supabase";
import type { Database } from "@aurora/shared";
import { calcularProximaRevisao, QUALIDADE_POR_BOTAO, type BotaoRevisao } from "@aurora/shared";

export type { BotaoRevisao };

type StatusTopico = Database["public"]["Enums"]["status_topico"];
type CategoriaEstudo = Database["public"]["Enums"]["categoria_estudo"];
type MotivoErro = Database["public"]["Enums"]["motivo_erro_questao"];
export type TipoConteudo = Database["public"]["Enums"]["tipo_conteudo_topico"];

/** Gestão de conteúdo de Estudos é só-online, mesmo critério já usado
 * para categorias financeiras: não é uso diário offline. */

// ---------------------------------------------------------------------------
// Disciplinas e tópicos
// ---------------------------------------------------------------------------

export type Disciplina = { id: string; nome: string; area: string; ordem_no_ciclo: number };
export type Topico = {
  id: string;
  titulo: string;
  status: StatusTopico;
  contador_revisoes: number;
  topico_pai_id: string | null;
  incidencia: string | null;
  disciplina_id: string;
  tipo_conteudo: TipoConteudo;
  ordem_na_lista: number;
};

export async function listarDisciplinas(): Promise<Disciplina[]> {
  const { data } = await supabase
    .from("disciplina")
    .select("id, nome, area, ordem_no_ciclo")
    .eq("ativa", true)
    .order("ordem_no_ciclo");
  return data ?? [];
}

export async function criarDisciplina(
  nome: string,
  area: string,
  ordemNoCiclo: number
): Promise<string | null> {
  const { error } = await supabase
    .from("disciplina")
    .insert({ nome, area, ordem_no_ciclo: ordemNoCiclo });
  return error?.message ?? null;
}

export async function listarTopicos(): Promise<Topico[]> {
  const { data } = await supabase
    .from("topico_edital")
    .select(
      "id, titulo, status, contador_revisoes, topico_pai_id, incidencia, disciplina_id, tipo_conteudo, ordem_na_lista"
    );
  return data ?? [];
}

/**
 * Tópicos-raiz entram numerados no fim de uma das duas listas paralelas
 * (Lei Seca ou Doutrina) da disciplina; subtópicos herdam o tipo_conteudo
 * do pai em vez de escolher de novo.
 */
export async function criarTopico(
  disciplinaId: string,
  titulo: string,
  topicoPaiId: string | null,
  incidencia: string | null,
  tipoConteudoRaiz?: TipoConteudo
): Promise<string | null> {
  let tipoConteudo: TipoConteudo;

  if (topicoPaiId) {
    const { data: pai, error: erroPai } = await supabase
      .from("topico_edital")
      .select("tipo_conteudo")
      .eq("id", topicoPaiId)
      .single();
    if (erroPai) return erroPai.message;
    tipoConteudo = pai.tipo_conteudo;
  } else {
    if (!tipoConteudoRaiz) return "Selecione lei seca ou doutrina.";
    tipoConteudo = tipoConteudoRaiz;
  }

  let ordemNaLista = 0;
  if (!topicoPaiId) {
    const { data: ultimo } = await supabase
      .from("topico_edital")
      .select("ordem_na_lista")
      .eq("disciplina_id", disciplinaId)
      .eq("tipo_conteudo", tipoConteudo)
      .is("topico_pai_id", null)
      .order("ordem_na_lista", { ascending: false })
      .limit(1)
      .maybeSingle();
    ordemNaLista = (ultimo?.ordem_na_lista ?? 0) + 1;
  }

  const { error } = await supabase.from("topico_edital").insert({
    disciplina_id: disciplinaId,
    titulo,
    topico_pai_id: topicoPaiId,
    incidencia,
    tipo_conteudo: tipoConteudo,
    ordem_na_lista: ordemNaLista,
  });
  return error?.message ?? null;
}

/**
 * "Consolidado" exige contador_revisoes >= 3 (constraint do banco). Cada
 * transição PARA "revisado" conta como uma revisão. A regra alternativa
 * (80%+ de acerto em 10+ questões) não altera este campo — só entra no
 * cálculo de cobertura.
 */
export async function atualizarStatusTopico(
  id: string,
  novoStatus: StatusTopico
): Promise<string | null> {
  const { data: topico, error: erroLeitura } = await supabase
    .from("topico_edital")
    .select("contador_revisoes")
    .eq("id", id)
    .single();
  if (erroLeitura) return erroLeitura.message;

  if (novoStatus === "consolidado" && topico.contador_revisoes < 3) {
    return "Só é possível consolidar após 3 revisões.";
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
  return error?.message ?? null;
}

// ---------------------------------------------------------------------------
// Cobertura
// ---------------------------------------------------------------------------

export type Cobertura = {
  percentualTocado: number;
  percentualConsolidado: number;
  tocados: number;
  consolidados: number;
  total: number;
};

export async function calcularCobertura(): Promise<Cobertura | null> {
  const [{ data: topicos }, { data: questoes }] = await Promise.all([
    supabase.from("topico_edital").select("id, status"),
    supabase.from("questao").select("topico_id, resposta_questao(acertou)"),
  ]);

  if (!topicos?.length) return null;

  const estatisticaPorTopico = new Map<string, { total: number; acertos: number }>();
  for (const q of questoes ?? []) {
    const atual = estatisticaPorTopico.get(q.topico_id) ?? { total: 0, acertos: 0 };
    for (const r of q.resposta_questao ?? []) {
      atual.total += 1;
      if (r.acertou) atual.acertos += 1;
    }
    estatisticaPorTopico.set(q.topico_id, atual);
  }

  const total = topicos.length;
  const tocados = topicos.filter((t) => t.status !== "nao_iniciado").length;
  const consolidados = topicos.filter((t) => {
    if (t.status === "consolidado") return true;
    const estatistica = estatisticaPorTopico.get(t.id);
    if (!estatistica || estatistica.total < 10) return false;
    return estatistica.acertos / estatistica.total >= 0.8;
  }).length;

  return {
    total,
    tocados,
    consolidados,
    percentualTocado: Math.round((tocados / total) * 100),
    percentualConsolidado: Math.round((consolidados / total) * 100),
  };
}

// ---------------------------------------------------------------------------
// Cronograma
// ---------------------------------------------------------------------------

export type BlocoCronograma = {
  id: string;
  data: string;
  categoria: CategoriaEstudo;
  status: string;
  duracao_planejada_min: number;
  disciplina_id: string;
  disciplina: { nome: string } | null;
  topico: { titulo: string } | null;
};

/** Segunda a domingo da semana que contém `hoje`. */
export function diasDaSemanaAtual(hoje: Date): string[] {
  const diaSemanaIso = (hoje.getDay() + 6) % 7; // 0 = segunda
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() - diaSemanaIso);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda);
    d.setDate(segunda.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export async function listarBlocosSemana(
  primeiroDia: string,
  ultimoDia: string
): Promise<BlocoCronograma[]> {
  const { data } = await supabase
    .from("bloco_cronograma")
    .select(
      "id, data, categoria, status, duracao_planejada_min, disciplina_id, disciplina:disciplina_id(nome), topico:topico_id(titulo)"
    )
    .gte("data", primeiroDia)
    .lte("data", ultimoDia);
  return data ?? [];
}

async function buscarDisciplinaMaisRecente(): Promise<string | null> {
  const { data } = await supabase
    .from("bloco_cronograma")
    .select("disciplina_id")
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.disciplina_id ?? null;
}

/** Ciclo de alternância: próxima disciplina na ordem_no_ciclo depois da do bloco mais recente (de qualquer semana). */
export async function sugerirProximaDisciplina(disciplinas: Disciplina[]): Promise<string | null> {
  if (!disciplinas.length) return null;
  const maisRecenteId = await buscarDisciplinaMaisRecente();
  if (!maisRecenteId) return disciplinas[0].id;
  const indiceAtual = disciplinas.findIndex((d) => d.id === maisRecenteId);
  return indiceAtual >= 0
    ? disciplinas[(indiceAtual + 1) % disciplinas.length].id
    : disciplinas[0].id;
}

export async function criarBlocoCronograma(input: {
  data: string;
  disciplinaId: string;
  topicoId: string | null;
  categoria: CategoriaEstudo;
  duracaoPlanejadaMin: number;
}): Promise<string | null> {
  const { error } = await supabase.from("bloco_cronograma").insert({
    data: input.data,
    disciplina_id: input.disciplinaId,
    topico_id: input.topicoId,
    categoria: input.categoria,
    duracao_planejada_min: input.duracaoPlanejadaMin,
  });
  return error?.message ?? null;
}

export async function marcarBlocoStatus(
  id: string,
  status: "concluido" | "perdido"
): Promise<string | null> {
  const { error } = await supabase.from("bloco_cronograma").update({ status }).eq("id", id);
  return error?.message ?? null;
}

/** Realoca sem apagar histórico: bloco original vira "realocado", bloco novo aponta pra ele. */
export async function realocarBloco(
  blocoId: string,
  novaData: string,
  motivo: string | null
): Promise<string | null> {
  const { data: original, error: erroLeitura } = await supabase
    .from("bloco_cronograma")
    .select("disciplina_id, topico_id, categoria, duracao_planejada_min")
    .eq("id", blocoId)
    .single();
  if (erroLeitura) return erroLeitura.message;

  const { error: erroNovo } = await supabase.from("bloco_cronograma").insert({
    data: novaData,
    disciplina_id: original.disciplina_id,
    topico_id: original.topico_id,
    categoria: original.categoria,
    duracao_planejada_min: original.duracao_planejada_min,
    bloco_origem_id: blocoId,
  });
  if (erroNovo) return erroNovo.message;

  const { error: erroAtualiza } = await supabase
    .from("bloco_cronograma")
    .update({ status: "realocado", motivo_realocacao: motivo })
    .eq("id", blocoId);
  return erroAtualiza?.message ?? null;
}

// ---------------------------------------------------------------------------
// Banco de questões
// ---------------------------------------------------------------------------

export type Questao = {
  id: string;
  enunciado: string;
  gabarito: string;
  banca: string | null;
  ano: number | null;
  respondida: boolean;
};

export async function listarQuestoesDoTopico(topicoId: string): Promise<Questao[]> {
  const { data } = await supabase
    .from("questao")
    .select("id, enunciado, gabarito, banca, ano, resposta_questao(id)")
    .eq("topico_id", topicoId);

  return (data ?? []).map((q) => ({
    id: q.id,
    enunciado: q.enunciado,
    gabarito: q.gabarito,
    banca: q.banca,
    ano: q.ano,
    respondida: (q.resposta_questao?.length ?? 0) > 0,
  }));
}

export async function criarQuestao(input: {
  topicoId: string;
  enunciado: string;
  gabarito: string;
  banca: string | null;
  ano: number | null;
}): Promise<string | null> {
  const { error } = await supabase.from("questao").insert({
    topico_id: input.topicoId,
    enunciado: input.enunciado,
    gabarito: input.gabarito,
    banca: input.banca,
    ano: input.ano,
  });
  return error?.message ?? null;
}

/** motivo_erro é obrigatório quando acertou = false — chk_motivo_erro_obrigatorio do schema. */
export async function responderQuestao(
  questaoId: string,
  acertou: boolean,
  motivoErro: MotivoErro | null
): Promise<string | null> {
  if (!acertou && !motivoErro) return "Selecione o motivo do erro.";
  const { error } = await supabase.from("resposta_questao").insert({
    questao_id: questaoId,
    acertou,
    motivo_erro: acertou ? null : motivoErro,
  });
  return error?.message ?? null;
}

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

export type Flashcard = {
  id: string;
  frente: string;
  verso: string;
  topico: { titulo: string } | null;
};

export async function listarFilaDoDia(): Promise<Flashcard[]> {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("flashcard")
    .select("id, frente, verso, topico:topico_id(titulo)")
    .eq("ativo", true)
    .lte("proxima_revisao", hoje)
    .order("proxima_revisao");
  return data ?? [];
}

export async function criarFlashcard(input: {
  topicoId: string;
  frente: string;
  verso: string;
}): Promise<string | null> {
  const { error } = await supabase.from("flashcard").insert({
    topico_id: input.topicoId,
    frente: input.frente,
    verso: input.verso,
  });
  return error?.message ?? null;
}

export async function revisarFlashcard(
  flashcardId: string,
  botao: BotaoRevisao
): Promise<string | null> {
  const { data: flashcard, error: erroLeitura } = await supabase
    .from("flashcard")
    .select("intervalo_atual_dias, fator_facilidade")
    .eq("id", flashcardId)
    .single();
  if (erroLeitura) return erroLeitura.message;

  const qualidade = QUALIDADE_POR_BOTAO[botao];
  const { novoIntervalo, novoFator } = calcularProximaRevisao(
    qualidade,
    flashcard.intervalo_atual_dias,
    flashcard.fator_facilidade
  );

  const proximaData = new Date();
  proximaData.setDate(proximaData.getDate() + novoIntervalo);

  const { error: erroUpdate } = await supabase
    .from("flashcard")
    .update({
      intervalo_atual_dias: novoIntervalo,
      fator_facilidade: novoFator,
      proxima_revisao: proximaData.toISOString().slice(0, 10),
    })
    .eq("id", flashcardId);
  if (erroUpdate) return erroUpdate.message;

  const { error: erroRevisao } = await supabase.from("revisao_flashcard").insert({
    flashcard_id: flashcardId,
    qualidade_resposta: qualidade,
    novo_intervalo_dias: novoIntervalo,
  });
  return erroRevisao?.message ?? null;
}
