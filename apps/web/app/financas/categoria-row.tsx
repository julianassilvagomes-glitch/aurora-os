"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, Lock, RotateCcw } from "lucide-react";
import {
  editarCategoria,
  reativarCategoria,
  removerOuDesativarCategoria,
  type ActionState,
} from "./actions";

const initialState: ActionState = { error: null };

export function CategoriaRow({
  categoria,
  temLancamentos,
}: {
  categoria: { id: string; nome: string; grupo: string; ativa: boolean };
  temLancamentos: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [state, formAction, pending] = useActionState(editarCategoria, initialState);

  if (editando) {
    return (
      <form
        action={async (formData) => {
          await formAction(formData);
          setEditando(false);
        }}
        className="flex flex-col gap-2 rounded-control border border-border bg-background p-2"
      >
        <input type="hidden" name="id" value={categoria.id} />
        <div className="flex gap-2">
          <input
            name="nome"
            defaultValue={categoria.nome}
            className="w-full rounded-control border border-border bg-surface px-2 py-1 text-sm text-foreground"
            required
          />
          <select
            name="grupo"
            defaultValue={categoria.grupo}
            className="rounded-control border border-border bg-surface px-2 py-1 text-sm text-foreground"
          >
            <option value="fixo">fixo</option>
            <option value="variavel">variável</option>
            <option value="estudo">estudo</option>
            <option value="trabalho">trabalho</option>
            <option value="pessoal">pessoal</option>
          </select>
        </div>
        {state.error && <p className="text-xs text-danger">{state.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-control bg-primary px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="rounded-control border border-border px-2 py-1 text-xs text-text-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  async function excluirOuDesativar() {
    if (!temLancamentos && !window.confirm(`Excluir a categoria "${categoria.nome}"?`)) {
      return;
    }
    setProcessando(true);
    await removerOuDesativarCategoria(categoria.id);
    setProcessando(false);
  }

  async function reativar() {
    setProcessando(true);
    await reativarCategoria(categoria.id);
    setProcessando(false);
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-control border border-border bg-background px-3 py-2 text-sm">
      <span className={categoria.ativa ? "text-foreground" : "text-text-secondary"}>
        {categoria.nome}
        {!categoria.ativa && <span className="ml-1.5 text-xs">(desativada)</span>}
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label="Editar categoria"
          className="text-text-secondary hover:text-primary"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.75} />
        </button>
        {categoria.ativa ? (
          <button
            type="button"
            onClick={excluirOuDesativar}
            disabled={processando}
            aria-label={temLancamentos ? "Desativar categoria" : "Excluir categoria"}
            title={
              temLancamentos
                ? "Tem lançamentos vinculados — só é possível desativar"
                : "Excluir categoria"
            }
            className="text-text-secondary hover:text-danger disabled:opacity-50"
          >
            {temLancamentos ? (
              <Lock className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={reativar}
            disabled={processando}
            aria-label="Reativar categoria"
            title="Reativar categoria"
            className="text-text-secondary hover:text-primary disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </span>
    </li>
  );
}
