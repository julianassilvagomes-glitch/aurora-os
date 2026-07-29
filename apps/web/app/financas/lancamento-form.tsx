"use client";

import { useActionState } from "react";
import { criarLancamento, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

export function LancamentoForm({
  categorias,
}: {
  categorias: { id: string; nome: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    criarLancamento,
    initialState
  );

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <div className="flex gap-3">
        <select
          name="tipo"
          defaultValue="despesa"
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="despesa">Despesa</option>
          <option value="receita">Receita</option>
        </select>
        <input
          type="number"
          name="valor"
          step="0.01"
          min="0.01"
          placeholder="valor"
          required
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="flex gap-3">
        <select
          name="categoria_id"
          required
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="data"
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <input
        type="text"
        name="descricao"
        placeholder="descrição (opcional)"
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input type="checkbox" name="recorrente" />
        recorrente
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Salvando..." : "Adicionar lançamento"}
      </button>
    </form>
  );
}
