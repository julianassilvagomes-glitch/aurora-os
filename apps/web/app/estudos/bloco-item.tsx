"use client";

import { useActionState, useState } from "react";
import { marcarBlocoStatus, realocarBloco, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

const rotuloCategoria: Record<string, string> = {
  lei_seca: "lei seca",
  jurisprudencia: "jurisprudência",
  questoes: "questões",
  revisao: "revisão",
  redacao: "redação",
};

const rotuloStatus: Record<string, string> = {
  planejado: "planejado",
  realocado: "realocado",
  concluido: "concluído",
  perdido: "perdido",
};

export function BlocoItem({
  bloco,
}: {
  bloco: {
    id: string;
    data: string;
    categoria: string;
    status: string;
    duracao_planejada_min: number;
    disciplina: { nome: string } | null;
    topico: { titulo: string } | null;
  };
}) {
  const [processando, setProcessando] = useState(false);
  const [mostrarRealocar, setMostrarRealocar] = useState(false);
  const [state, formAction, pending] = useActionState(realocarBloco, initialState);

  async function concluir() {
    setProcessando(true);
    await marcarBlocoStatus(bloco.id, "concluido");
    setProcessando(false);
  }

  async function marcarPerdido() {
    setProcessando(true);
    await marcarBlocoStatus(bloco.id, "perdido");
    setProcessando(false);
  }

  return (
    <li className="rounded-card border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-foreground">
            {bloco.disciplina?.nome ?? "—"}
            {bloco.topico ? ` · ${bloco.topico.titulo}` : ""}
          </p>
          <p className="text-xs text-text-secondary">
            {bloco.data} · {rotuloCategoria[bloco.categoria] ?? bloco.categoria} ·{" "}
            {bloco.duracao_planejada_min} min · {rotuloStatus[bloco.status] ?? bloco.status}
          </p>
        </div>
        {bloco.status === "planejado" && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={concluir}
              disabled={processando}
              className="text-xs text-success disabled:opacity-50"
            >
              concluir
            </button>
            <button
              type="button"
              onClick={marcarPerdido}
              disabled={processando}
              className="text-xs text-text-secondary hover:text-danger disabled:opacity-50"
            >
              perdido
            </button>
          </div>
        )}
        {bloco.status === "perdido" && (
          <button
            type="button"
            onClick={() => setMostrarRealocar((v) => !v)}
            className="shrink-0 text-xs text-primary"
          >
            realocar
          </button>
        )}
      </div>

      {mostrarRealocar && (
        <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="bloco_id" value={bloco.id} />
          <input
            type="date"
            name="nova_data"
            required
            className="rounded-control border border-border bg-background px-2 py-1 text-xs text-foreground"
          />
          <input
            name="motivo"
            placeholder="motivo da realocação (opcional)"
            className="rounded-control border border-border bg-background px-2 py-1 text-xs text-foreground"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-control bg-primary px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            {pending ? "Salvando..." : "Confirmar"}
          </button>
          {state.error && <p className="w-full text-xs text-danger">{state.error}</p>}
        </form>
      )}
    </li>
  );
}
