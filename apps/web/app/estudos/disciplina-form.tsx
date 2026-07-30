"use client";

import { useActionState } from "react";
import { criarDisciplina, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

export function DisciplinaForm() {
  const [state, formAction, pending] = useActionState(criarDisciplina, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        name="nome"
        placeholder="nova disciplina"
        required
        className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground"
      />
      <input
        name="area"
        placeholder="área"
        required
        className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground"
      />
      <input
        name="ordem_no_ciclo"
        type="number"
        min={1}
        placeholder="ordem no ciclo"
        required
        className="w-32 rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-control border border-border px-3 py-2 text-sm text-primary disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar disciplina"}
      </button>
      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
