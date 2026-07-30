"use client";

import { useActionState } from "react";
import { criarTopico, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

export function TopicoForm({
  disciplinaId,
  topicoPaiId,
  aoFechar,
}: {
  disciplinaId: string;
  topicoPaiId: string | null;
  aoFechar?: () => void;
}) {
  const [state, formAction, pending] = useActionState(criarTopico, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 py-1">
      <input type="hidden" name="disciplina_id" value={disciplinaId} />
      {topicoPaiId && <input type="hidden" name="topico_pai_id" value={topicoPaiId} />}
      <input
        name="titulo"
        placeholder={topicoPaiId ? "novo subtópico" : "novo tópico"}
        required
        className="rounded-control border border-border bg-background px-2 py-1 text-xs text-foreground"
      />
      <select
        name="incidencia"
        defaultValue=""
        className="rounded-control border border-border bg-background px-2 py-1 text-xs text-foreground"
      >
        <option value="">incidência</option>
        <option value="alta">alta</option>
        <option value="media">média</option>
        <option value="baixa">baixa</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-control bg-primary px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar"}
      </button>
      {aoFechar && (
        <button type="button" onClick={aoFechar} className="text-xs text-text-secondary">
          fechar
        </button>
      )}
      {state.error && <p className="w-full text-xs text-danger">{state.error}</p>}
    </form>
  );
}
