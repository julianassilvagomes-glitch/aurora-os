import { supabase } from "./supabase";
import { readJson, writeJson } from "./storage";

const SALDO_KEY = "aurora:saldo";

export type Saldo = {
  saldoAtual: number;
  totalReceitas: number;
  totalDespesas: number;
  mesesRestantes: number | null;
};

const saldoVazio: Saldo = {
  saldoAtual: 0,
  totalReceitas: 0,
  totalDespesas: 0,
  mesesRestantes: null,
};

export async function saldoEmCache(): Promise<Saldo> {
  return readJson<Saldo>(SALDO_KEY, saldoVazio);
}

export async function atualizarSaldoCache(): Promise<void> {
  const [{ data: lancamentos, error }, { data: runway }] = await Promise.all([
    supabase.from("lancamento_financeiro").select("tipo, valor"),
    supabase.from("runway_atual").select("saldo_atual, media_despesas_3_meses").maybeSingle(),
  ]);

  if (error || !lancamentos) return;

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === "receita")
    .reduce((soma, l) => soma + l.valor, 0);
  const totalDespesas = lancamentos
    .filter((l) => l.tipo === "despesa")
    .reduce((soma, l) => soma + l.valor, 0);
  const saldoAtual = runway?.saldo_atual ?? totalReceitas - totalDespesas;
  const mediaDespesas = runway?.media_despesas_3_meses ?? 0;

  await writeJson<Saldo>(SALDO_KEY, {
    saldoAtual,
    totalReceitas,
    totalDespesas,
    mesesRestantes: mediaDespesas > 0 ? saldoAtual / mediaDespesas : null,
  });
}
