"use client";

import { useActionState } from "react";
import { criarQuestao, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

export function QuestaoForm({
  topicos,
}: {
  topicos: { id: string; titulo: string }[];
}) {
  const [state, formAction, pending] = useActionState(criarQuestao, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
    >
      <select
        name="topico_id"
        required
        defaultValue=""
        className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="">tópico</option>
        {topicos.map((t) => (
          <option key={t.id} value={t.id}>
            {t.titulo}
          </option>
        ))}
      </select>
      <textarea
        name="enunciado"
        placeholder="enunciado"
        required
        rows={3}
        className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      <textarea
        name="gabarito"
        placeholder="gabarito"
        required
        rows={2}
        className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      <div className="flex gap-3">
        <input
          name="banca"
          placeholder="banca (opcional)"
          className="w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <input
          name="ano"
          type="number"
          placeholder="ano (opcional)"
          className="w-32 rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-control bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar questão"}
      </button>
    </form>
  );
}
