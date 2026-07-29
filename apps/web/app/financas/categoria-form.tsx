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
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <select
        name="grupo"
        defaultValue="variavel"
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
        className="rounded border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
      >
        {pending ? "Salvando..." : "Adicionar categoria"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
