"use client";

import { useActionState } from "react";
import { criarFlashcard, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

export function FlashcardForm({ topicos }: { topicos: { id: string; titulo: string }[] }) {
  const [state, formAction, pending] = useActionState(criarFlashcard, initialState);

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
        name="frente"
        placeholder="frente"
        required
        rows={2}
        className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      <textarea
        name="verso"
        placeholder="verso"
        required
        rows={2}
        className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-control bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar flashcard"}
      </button>
    </form>
  );
}
