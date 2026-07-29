"use client";

import { useActionState } from "react";
import { criarCategoria, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

export function CategoriaForm() {
  const [state, formAction, pending] = useActionState(
    criarCategoria,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="nome"
        placeholder="nova categoria"
        required
        className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground"
      />
      <select
        name="grupo"
        defaultValue="variavel"
        className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground"
      >
        <option value="fixo">fixo</option>
        <option value="variavel">variável</option>
        <option value="estudo">estudo</option>
        <option value="trabalho">trabalho</option>
        <option value="pessoal">pessoal</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-control border border-border px-3 py-2 text-sm text-primary disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar categoria"}
      </button>
      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
