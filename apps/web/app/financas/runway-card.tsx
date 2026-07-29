import { createClient } from "@/lib/supabase/server";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function RunwayCard() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("runway_atual")
    .select("saldo_atual, media_despesas_3_meses")
    .maybeSingle();

  if (error) {
    return <p className="text-sm text-red-600">{error.message}</p>;
  }

  const saldo = data?.saldo_atual ?? 0;
  const mediaDespesas = data?.media_despesas_3_meses ?? 0;
  const mesesRestantes = mediaDespesas > 0 ? saldo / mediaDespesas : null;

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-500">Saldo atual</p>
        <p className="text-lg font-semibold text-black dark:text-zinc-50">
          {formatarMoeda(saldo)}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-500">Média de despesas (3 meses)</p>
        <p className="text-lg font-semibold text-black dark:text-zinc-50">
          {formatarMoeda(mediaDespesas)}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-500">Runway</p>
        <p className="text-lg font-semibold text-black dark:text-zinc-50">
          {mesesRestantes === null
            ? "sem despesas registradas"
            : `${mesesRestantes.toFixed(1)} meses`}
        </p>
      </div>
    </div>
  );
}
