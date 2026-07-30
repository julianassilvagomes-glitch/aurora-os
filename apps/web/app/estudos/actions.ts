"use server";

import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@aurora/shared";
import { calcularProximaRevisao, QUALIDADE_POR_BOTAO, type BotaoRevisao } from "@aurora/shared";

export type ActionState = { error: string | null };

type StatusTopico = Database["public"]["Enums"]["status_topico"];
type CategoriaEstudo = Database["public"]["Enums"]["categoria_estudo"];
type MotivoErro = Database["public"]["Enums"]["motivo_erro_questao"];
type TipoConteudo = Database["public"]["Enums"]["tipo_conteudo_topico"];

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

/**
 * Tópicos-raiz (sem pai) pertencem a uma das duas listas paralelas por
 * disciplina — Lei Seca ou Doutrina — e entram numerados no fim da lista
 * (ordem_na_lista = próximo número da sequência). Subtópicos herdam o
 * tipo_conteudo do pai: um desdobramento de um item de Lei Seca continua
 * sendo Lei Seca, não uma escolha separada.
 */
export async function criarTopico(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await usuarioAutenticado();

  const disciplina_id = formData.get("disciplina_id");
  const topico_pai_id = formData.get("topico_pai_id");
  const titulo = formData.get("titulo");
  const incidencia = formData.get("incidencia");
  const tipoConteudoForm = formData.get("tipo_conteudo");

  if (typeof disciplina_id !== "string" || !disciplina_id) {
    return { error: "Selecione a disciplina." };
  }
  if (typeof titulo !== "string" || !titulo.trim()) {
    return { error: "Informe o título do tópico." };
  }

  const paiId = typeof topico_pai_id === "string" && topico_pai_id ? topico_pai_id : null;

  let tipoConteudo: TipoConteudo;
  if (paiId) {
    const { data: pai, error: erroPai } = await supabase
      .from("topico_edital")
      .select("tipo_conteudo")
      .eq("id", paiId)
      .single();
    if (erroPai) return { error: erroPai.message };
    tipoConteudo = pai.tipo_conteudo;
  } else {
    if (tipoConteudoForm !== "lei_seca" && tipoConteudoForm !== "doutrina") {
      return { error: "Selecione lei seca ou doutrina." };
    }
    tipoConteudo = tipoConteudoForm;
  }

  let ordemNaLista = 0;
  if (!paiId) {
    const { data: ultimo } = await supabase
      .from("topico_edital")
      .select("ordem_na_lista")
      .eq("disciplina_id", disciplina_id)
      .eq("tipo_conteudo", tipoConteudo)
      .is("topico_pai_id", null)
      .order("ordem_na_lista", { ascending: false })
      .limit(1)
      .maybeSingle();
    ordemNaLista = (ultimo?.ordem_na_lista ?? 0) + 1;
  }

  const { error } = await supabase.from("topico_edital").insert({
    disciplina_id,
    topico_pai_id: paiId,
    titulo: titulo.trim(),
    incidencia:
      typeof incidencia === "string" && incidencia ? incidencia : null,
    tipo_conteudo: tipoConteudo,
    ordem_na_lista: ordemNaLista,
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

// ---------------------------------------------------------------------------
// Verticalização automática de edital por IA
// ---------------------------------------------------------------------------

export type DisciplinaVerticalizada = {
  nome: string;
  area: string;
  lei_seca: string[];
  doutrina: string[];
};

export type VerticalizarState = {
  error: string | null;
  resultado: DisciplinaVerticalizada[] | null;
};

const ESQUEMA_VERTICALIZACAO = {
  type: "object",
  properties: {
    disciplinas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          area: { type: "string" },
          lei_seca: { type: "array", items: { type: "string" } },
          doutrina: { type: "array", items: { type: "string" } },
        },
        required: ["nome", "area", "lei_seca", "doutrina"],
        additionalProperties: false,
      },
    },
  },
  required: ["disciplinas"],
  additionalProperties: false,
} as const;

const PROMPT_VERTICALIZACAO = `Você organiza o texto bruto de um edital de concurso público em disciplinas e tópicos verticalizados.

Para cada disciplina que aparecer no texto:
- "nome": nome da disciplina (ex.: "Direito Constitucional").
- "area": área/eixo a que pertence (ex.: "Direito Público"). Se não for possível inferir, use "geral".
- "lei_seca": lista de tópicos de lei seca — dispositivos legais, artigos, incisos — cada item é um título curto (poucas palavras), na ordem em que devem ser estudados.
- "doutrina": lista de tópicos de doutrina/teoria sobre o mesmo assunto, também em títulos curtos, na ordem de estudo.

As duas listas de uma disciplina são independentes uma da outra — um mesmo assunto pode aparecer em lei_seca e em doutrina como itens separados. Não invente conteúdo que não esteja no texto. Não gere números — a ordem das duas listas já é a numeração.`;

/**
 * Respeita permissao_ia do módulo "estudos": nunca chama a IA se o nível
 * de acesso for "sem_acesso" (padrão quando a linha nem existe — acesso
 * nunca é o padrão, mesma regra do resto do sistema).
 */
export async function verticalizarComIA(
  _prevState: VerticalizarState,
  formData: FormData
): Promise<VerticalizarState> {
  const supabase = await usuarioAutenticado();

  const texto = formData.get("texto_bruto");
  if (typeof texto !== "string" || !texto.trim()) {
    return { error: "Cole o texto do edital primeiro.", resultado: null };
  }

  const { data: permissao } = await supabase
    .from("permissao_ia")
    .select("nivel_acesso")
    .eq("modulo", "estudos")
    .maybeSingle();

  if (!permissao || permissao.nivel_acesso === "sem_acesso") {
    return {
      error:
        'IA sem permissão para o módulo Estudos. Ajuste em Configurações → Permissão de IA antes de usar a verticalização automática.',
      resultado: null,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      error: "ANTHROPIC_API_KEY não configurada neste ambiente — peça para configurarem antes de usar essa função.",
      resultado: null,
    };
  }

  const client = new Anthropic({ apiKey });
  const textoBruto = texto.trim();

  let resposta;
  try {
    resposta = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      output_config: { format: { type: "json_schema", schema: ESQUEMA_VERTICALIZACAO } },
      messages: [
        { role: "user", content: `${PROMPT_VERTICALIZACAO}\n\n---\n\n${textoBruto}` },
      ],
    });
  } catch (e) {
    return {
      error: e instanceof Error ? `Erro ao chamar a IA: ${e.message}` : "Erro ao chamar a IA.",
      resultado: null,
    };
  }

  if (resposta.stop_reason === "refusal") {
    return { error: "A IA recusou processar esse texto.", resultado: null };
  }

  const blocoTexto = resposta.content.find(
    (bloco): bloco is Anthropic.TextBlock => bloco.type === "text"
  );
  if (!blocoTexto) {
    return { error: "A IA não retornou nenhum texto.", resultado: null };
  }

  let estrutura: { disciplinas: DisciplinaVerticalizada[] };
  try {
    estrutura = JSON.parse(blocoTexto.text);
  } catch {
    return { error: "A resposta da IA veio em formato inválido.", resultado: null };
  }

  // Registro obrigatório da interação — o schema não tem um tipo dedicado
  // a "verticalização", então usamos "resumo" (organizar/condensar texto
  // bruto em estrutura), o mais próximo dos quatro valores permitidos por
  // chk em interacao_ia_estudos.tipo.
  const { error: erroInteracao } = await supabase.from("interacao_ia_estudos").insert({
    tipo: "resumo",
    prompt_enviado: textoBruto,
    resposta_recebida: blocoTexto.text,
  });
  if (erroInteracao) return { error: erroInteracao.message, resultado: null };

  return { error: null, resultado: estrutura.disciplinas };
}

/**
 * Só é chamada depois da confirmação manual na tela de revisão — nunca
 * grava o resultado da IA direto, mesma regra já aplicada a flashcards
 * gerados por IA (origem = 'gerado_por_ia' só vira ativo após
 * confirmação humana).
 */
export async function confirmarVerticalizacao(estrutura: {
  disciplinas: DisciplinaVerticalizada[];
}): Promise<{ error: string | null }> {
  const supabase = await usuarioAutenticado();

  const { data: ultimaDisciplina } = await supabase
    .from("disciplina")
    .select("ordem_no_ciclo")
    .order("ordem_no_ciclo", { ascending: false })
    .limit(1)
    .maybeSingle();
  let proximaOrdemCiclo = (ultimaDisciplina?.ordem_no_ciclo ?? 0) + 1;

  for (const disciplinaVerticalizada of estrutura.disciplinas) {
    const nome = disciplinaVerticalizada.nome.trim();
    if (!nome) continue;

    let disciplinaId: string;
    const { data: existente } = await supabase
      .from("disciplina")
      .select("id")
      .eq("nome", nome)
      .maybeSingle();

    if (existente) {
      disciplinaId = existente.id;
    } else {
      const { data: nova, error: erroNova } = await supabase
        .from("disciplina")
        .insert({
          nome,
          area: disciplinaVerticalizada.area.trim() || "geral",
          ordem_no_ciclo: proximaOrdemCiclo,
        })
        .select("id")
        .single();
      if (erroNova) return { error: erroNova.message };
      disciplinaId = nova.id;
      proximaOrdemCiclo += 1;
    }

    for (const tipoConteudo of ["lei_seca", "doutrina"] as const) {
      const itens = disciplinaVerticalizada[tipoConteudo]
        .map((t) => t.trim())
        .filter(Boolean);
      if (!itens.length) continue;

      const { data: ultimoItem } = await supabase
        .from("topico_edital")
        .select("ordem_na_lista")
        .eq("disciplina_id", disciplinaId)
        .eq("tipo_conteudo", tipoConteudo)
        .is("topico_pai_id", null)
        .order("ordem_na_lista", { ascending: false })
        .limit(1)
        .maybeSingle();
      let proximaOrdemLista = (ultimoItem?.ordem_na_lista ?? 0) + 1;

      const linhas = itens.map((titulo) => ({
        disciplina_id: disciplinaId,
        titulo,
        tipo_conteudo: tipoConteudo,
        ordem_na_lista: proximaOrdemLista++,
      }));

      const { error: erroInsert } = await supabase.from("topico_edital").insert(linhas);
      if (erroInsert) return { error: erroInsert.message };
    }
  }

  revalidatePath("/estudos");
  return { error: null };
}
