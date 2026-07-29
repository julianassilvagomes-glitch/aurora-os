"use client";

import { useActionState } from "react";
import { criarLancamento, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

const inputClasses =
  "rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground";

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
      className="flex w-full flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      <div className="flex gap-3">
        <select name="tipo" defaultValue="despesa" className={inputClasses}>
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
          className={`w-full ${inputClasses}`}
        />
      </div>
      <div className="flex gap-3">
        <select name="categoria_id" required className={`w-full ${inputClasses}`}>
          <option value="">categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <input type="date" name="data" className={inputClasses} />
      </div>
      <input
        type="text"
        name="descricao"
        placeholder="descrição (opcional)"
        className={inputClasses}
      />
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" name="recorrente" />
        recorrente
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-control bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar lançamento"}
      </button>
    </form>
  );
}
