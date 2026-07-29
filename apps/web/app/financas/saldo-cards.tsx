import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function SaldoCards() {
  const supabase = await createClient();

  const [{ data: lancamentos, error }, { data: runway }] = await Promise.all([
    supabase.from("lancamento_financeiro").select("tipo, valor"),
    supabase
      .from("runway_atual")
      .select("saldo_atual, media_despesas_3_meses")
      .maybeSingle(),
  ]);

  if (error) {
    return <p className="text-sm text-danger">{error.message}</p>;
  }

  const totalReceitas = (lancamentos ?? [])
    .filter((l) => l.tipo === "receita")
    .reduce((soma, l) => soma + l.valor, 0);
  const totalDespesas = (lancamentos ?? [])
    .filter((l) => l.tipo === "despesa")
    .reduce((soma, l) => soma + l.valor, 0);
  const saldo = runway?.saldo_atual ?? totalReceitas - totalDespesas;
  const mediaDespesas = runway?.media_despesas_3_meses ?? 0;
  const mesesRestantes = mediaDespesas > 0 ? saldo / mediaDespesas : null;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="rounded-card border border-border bg-surface-primary p-5">
        <p className="text-xs text-text-secondary">Saldo atual</p>
        <p className="text-3xl font-semibold text-primary-dark">
          {formatarMoeda(saldo)}
        </p>
      </div>

      {/* Exceção deliberada ao "nenhuma cor decorativa": só receita/despesa,
          só aqui. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-card bg-receita-bg p-4">
          <ArrowUpRight className="h-5 w-5 text-receita-text" strokeWidth={1.75} />
          <div>
            <p className="text-xs text-receita-text">Receitas</p>
            <p className="font-semibold text-receita-text">
              {formatarMoeda(totalReceitas)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-card bg-despesa-bg p-4">
          <ArrowDownRight className="h-5 w-5 text-despesa-text" strokeWidth={1.75} />
          <div>
            <p className="text-xs text-despesa-text">Despesas</p>
            <p className="font-semibold text-despesa-text">
              {formatarMoeda(totalDespesas)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-xs text-text-secondary">
          Runway (com base na média de despesas dos últimos 3 meses)
        </p>
        <p className="font-semibold text-foreground">
          {mesesRestantes === null
            ? "sem despesas registradas"
            : `${mesesRestantes.toFixed(1)} meses`}
        </p>
      </div>
    </div>
  );
}
