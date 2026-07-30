"use client";

import { useActionState } from "react";
import { criarBlocoCronograma, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

const categorias = [
  { valor: "lei_seca", rotulo: "lei seca" },
  { valor: "jurisprudencia", rotulo: "jurisprudência" },
  { valor: "questoes", rotulo: "questões" },
  { valor: "revisao", rotulo: "revisão" },
  { valor: "redacao", rotulo: "redação" },
];

export function CronogramaForm({
  disciplinas,
  topicos,
  disciplinaSugeridaId,
}: {
  disciplinas: { id: string; nome: string }[];
  topicos: { id: string; titulo: string; disciplina_id: string }[];
  disciplinaSugeridaId: string | null;
}) {
  const [state, formAction, pending] = useActionState(criarBlocoCronograma, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      {disciplinaSugeridaId && (
        <p className="text-xs text-text-secondary">
          Sugestão do ciclo de alternância: próxima disciplina já vem selecionada.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          name="data"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <select
          name="disciplina_id"
          required
          defaultValue={disciplinaSugeridaId ?? ""}
          className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">disciplina</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
        <select
          name="categoria"
          required
          defaultValue=""
          className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">categoria</option>
          {categorias.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.rotulo}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="duracao_planejada_min"
          min={1}
          placeholder="minutos"
          required
          className="w-28 rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <select
        name="topico_id"
        defaultValue=""
        className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="">tópico (opcional)</option>
        {topicos.map((t) => (
          <option key={t.id} value={t.id}>
            {t.titulo}
          </option>
        ))}
      </select>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-control bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Adicionar bloco"}
      </button>
    </form>
  );
}
