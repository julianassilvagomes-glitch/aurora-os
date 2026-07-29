import type { Database } from "@aurora/shared";
import { supabase } from "./supabase";
import { readJson, writeJson } from "./storage";
import {
  type AcaoFila,
  descartarCriacaoLocal,
  enfileirar,
  gerarId,
  lerFila,
  removerDaFila,
} from "./outbox";

const CONFIRMADOS_KEY = "aurora:lancamentos_confirmados";
const ENTIDADE = "lancamento_financeiro";

export type Lancamento = {
  id: string;
  tipo: "receita" | "despesa";
  valor: number;
  data: string;
  categoria_id: string;
  descricao: string | null;
  recorrente: boolean;
};

export type LancamentoExibicao = Lancamento & { pendente: boolean };

async function lancamentosConfirmados(): Promise<Lancamento[]> {
  return readJson<Lancamento[]>(CONFIRMADOS_KEY, []);
}

/** Busca os lançamentos recentes do servidor e substitui o snapshot local usado offline. */
export async function atualizarLancamentosConfirmados(): Promise<void> {
  const { data, error } = await supabase
    .from("lancamento_financeiro")
    .select("id, tipo, valor, data, categoria_id, descricao, recorrente")
    .order("data", { ascending: false })
    .limit(30);

  if (error || !data) return;
  await writeJson(CONFIRMADOS_KEY, data);
}

/** Mescla o último snapshot confirmado do servidor com as ações ainda pendentes na fila offline. */
export async function listarLancamentos(): Promise<LancamentoExibicao[]> {
  const [confirmados, fila] = await Promise.all([
    lancamentosConfirmados(),
    lerFila(),
  ]);

  const idsExcluidosPendentes = new Set(
    fila
      .filter((a) => a.entidade === ENTIDADE && a.operacao === "excluir")
      .map((a) => a.payload.id as string)
  );

  const criadosPendentes: LancamentoExibicao[] = fila
    .filter((a) => a.entidade === ENTIDADE && a.operacao === "criar")
    .map((a) => ({ ...(a.payload as Lancamento), pendente: true }));

  const confirmadosVisiveis: LancamentoExibicao[] = confirmados
    .filter((l) => !idsExcluidosPendentes.has(l.id))
    .map((l) => ({ ...l, pendente: false }));

  return [...criadosPendentes, ...confirmadosVisiveis].sort((a, b) =>
    b.data.localeCompare(a.data)
  );
}

export async function criarLancamentoOffline(input: {
  tipo: "receita" | "despesa";
  valor: number;
  categoria_id: string;
  descricao: string | null;
  recorrente: boolean;
}): Promise<void> {
  const id = gerarId();
  const payload: Lancamento = {
    id,
    tipo: input.tipo,
    valor: input.valor,
    data: new Date().toISOString().slice(0, 10),
    categoria_id: input.categoria_id,
    descricao: input.descricao,
    recorrente: input.recorrente,
  };

  const acao: AcaoFila = {
    chave: id,
    entidade: ENTIDADE,
    operacao: "criar",
    payload,
    criadaEm: new Date().toISOString(),
  };
  await enfileirar(acao);
}

export async function excluirLancamento(id: string): Promise<void> {
  const eraSoLocal = await descartarCriacaoLocal(id);
  if (eraSoLocal) return;

  await enfileirar({
    chave: `${id}:excluir`,
    entidade: ENTIDADE,
    operacao: "excluir",
    payload: { id },
    criadaEm: new Date().toISOString(),
  });
}

export type ResultadoSincronizacao = {
  processadas: number;
  falhou: boolean;
};

/**
 * Drena a fila offline em ordem (FIFO), respeitando a idempotência do
 * servidor: cada ação chama registrar_acao_idempotente antes de mutar
 * dados. Uma falha para a fila no item atual (mantém ordem) e devolve o
 * controle para uma nova tentativa depois — não pula itens.
 */
export async function processarFila(): Promise<ResultadoSincronizacao> {
  const fila = await lerFila();
  let processadas = 0;

  for (const acao of fila) {
    try {
      const { data: acaoNova, error: erroRpc } = await supabase.rpc(
        "registrar_acao_idempotente",
        {
          p_chave: acao.chave,
          p_entidade: acao.entidade,
          p_operacao: acao.operacao,
        }
      );
      if (erroRpc) throw erroRpc;

      if (acaoNova) {
        if (acao.operacao === "criar") {
          const { error } = await supabase
            .from("lancamento_financeiro")
            .insert(
              acao.payload as Database["public"]["Tables"]["lancamento_financeiro"]["Insert"]
            );
          if (error) throw error;
        } else if (acao.operacao === "excluir") {
          const { error } = await supabase
            .from("lancamento_financeiro")
            .delete()
            .eq("id", acao.payload.id as string);
          if (error) throw error;
        }
      }
      // acaoNova === false: outro envio anterior já processou esta chave —
      // apenas descarta da fila local sem repetir a mutação.

      await removerDaFila(acao.chave);
      processadas += 1;
    } catch {
      return { processadas, falhou: true };
    }
  }

  if (processadas > 0) {
    await atualizarLancamentosConfirmados();
  }
  return { processadas, falhou: false };
}
