import { createClient } from "@/lib/supabase/server";
import { excluirLancamento } from "./actions";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function LancamentoList() {
  const supabase = await createClient();
  const { data: lancamentos, error } = await supabase
    .from("lancamento_financeiro")
    .select("id, tipo, valor, data, descricao, categoria_financeira(nome)")
    .order("data", { ascending: false })
    .limit(20);

  if (error) {
    return <p className="text-sm text-danger">{error.message}</p>;
  }

  if (!lancamentos?.length) {
    return (
      <p className="text-sm text-text-secondary">
        Nenhum lançamento registrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {lancamentos.map((l) => {
        const excluir = excluirLancamento.bind(null, l.id);
        return (
          <li
            key={l.id}
            className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-3 py-2 text-sm"
          >
            <div className="flex flex-col">
              <span className="text-foreground">
                {l.categoria_financeira?.nome ?? "—"}
                {l.descricao ? ` · ${l.descricao}` : ""}
              </span>
              <span className="text-xs text-text-secondary">{l.data}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">
                {l.tipo === "receita" ? "+" : "-"}
                {formatarMoeda(l.valor)}
              </span>
              <form action={excluir}>
                <button
                  type="submit"
                  className="text-xs text-text-secondary hover:text-danger"
                  aria-label="Excluir lançamento"
                >
                  excluir
                </button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
