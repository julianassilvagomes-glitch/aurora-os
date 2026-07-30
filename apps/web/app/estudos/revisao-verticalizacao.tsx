"use client";

import { Trash2, Plus } from "lucide-react";
import type { DisciplinaVerticalizada } from "./actions";

function ListaEditavel({
  titulo,
  itens,
  onChange,
}: {
  titulo: string;
  itens: string[];
  onChange: (itens: string[]) => void;
}) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-xs font-medium text-text-secondary">{titulo}</p>
      <ol className="flex flex-col gap-1">
        {itens.map((item, indice) => (
          <li key={indice} className="flex items-center gap-1">
            <span className="w-5 shrink-0 text-right text-xs text-text-secondary">
              {indice + 1}.
            </span>
            <input
              value={item}
              onChange={(e) => {
                const copia = [...itens];
                copia[indice] = e.target.value;
                onChange(copia);
              }}
              className="w-full rounded-control border border-border bg-background px-2 py-1 text-xs text-foreground"
            />
            <button
              type="button"
              onClick={() => onChange(itens.filter((_, i) => i !== indice))}
              aria-label="Remover item"
              className="text-text-secondary hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...itens, ""])}
        className="mt-1 ml-6 flex items-center gap-1 text-xs text-primary"
      >
        <Plus className="h-3 w-3" strokeWidth={2} /> item
      </button>
    </div>
  );
}

export function RevisaoVerticalizacao({
  disciplinas,
  onChange,
  onConfirmar,
  onDescartar,
  salvando,
  erro,
}: {
  disciplinas: DisciplinaVerticalizada[];
  onChange: (disciplinas: DisciplinaVerticalizada[]) => void;
  onConfirmar: () => void;
  onDescartar: () => void;
  salvando: boolean;
  erro: string | null;
}) {
  function atualizarDisciplina(indice: number, patch: Partial<DisciplinaVerticalizada>) {
    const copia = [...disciplinas];
    copia[indice] = { ...copia[indice], ...patch };
    onChange(copia);
  }

  function removerDisciplina(indice: number) {
    onChange(disciplinas.filter((_, i) => i !== indice));
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-primary bg-surface p-4">
      <p className="text-sm font-medium text-foreground">
        Revise antes de salvar — nada foi gravado ainda
      </p>

      {disciplinas.map((disciplina, indice) => (
        <div key={indice} className="rounded-control border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <input
              value={disciplina.nome}
              onChange={(e) => atualizarDisciplina(indice, { nome: e.target.value })}
              placeholder="disciplina"
              className="w-full rounded-control border border-border bg-surface px-2 py-1 text-sm font-medium text-foreground"
            />
            <input
              value={disciplina.area}
              onChange={(e) => atualizarDisciplina(indice, { area: e.target.value })}
              placeholder="área"
              className="w-40 rounded-control border border-border bg-surface px-2 py-1 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={() => removerDisciplina(indice)}
              aria-label="Remover disciplina"
              className="shrink-0 text-text-secondary hover:text-danger"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <ListaEditavel
              titulo="Lei Seca"
              itens={disciplina.lei_seca}
              onChange={(itens) => atualizarDisciplina(indice, { lei_seca: itens })}
            />
            <ListaEditavel
              titulo="Doutrina"
              itens={disciplina.doutrina}
              onChange={(itens) => atualizarDisciplina(indice, { doutrina: itens })}
            />
          </div>
        </div>
      ))}

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirmar}
          disabled={salvando}
          className="rounded-control bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Confirmar e salvar"}
        </button>
        <button
          type="button"
          onClick={onDescartar}
          disabled={salvando}
          className="rounded-control border border-border px-3 py-2 text-sm text-text-secondary disabled:opacity-50"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
