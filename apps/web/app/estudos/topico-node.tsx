"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { atualizarStatusTopico } from "./actions";
import { TopicoForm } from "./topico-form";
import type { Database } from "@aurora/shared";

type StatusTopico = Database["public"]["Enums"]["status_topico"];
type TipoConteudo = Database["public"]["Enums"]["tipo_conteudo_topico"];

export type Topico = {
  id: string;
  titulo: string;
  status: StatusTopico;
  contador_revisoes: number;
  topico_pai_id: string | null;
  incidencia: string | null;
  tipo_conteudo: TipoConteudo;
  ordem_na_lista: number;
};

const rotuloStatus: Record<StatusTopico, string> = {
  nao_iniciado: "não iniciado",
  em_estudo: "em estudo",
  revisado: "revisado",
  consolidado: "consolidado",
};

export function TopicoNode({
  topico,
  todos,
  disciplinaId,
}: {
  topico: Topico;
  todos: Topico[];
  disciplinaId: string;
}) {
  const filhos = todos.filter((t) => t.topico_pai_id === topico.id);
  const [aberto, setAberto] = useState(false);
  const [mostrarSubtopico, setMostrarSubtopico] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function mudarStatus(novoStatus: StatusTopico) {
    setSalvando(true);
    setErro(null);
    try {
      await atualizarStatusTopico(topico.id, novoStatus);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <li>
      <div className="flex items-center gap-2 py-1">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="text-text-secondary"
          aria-label={aberto ? "Recolher" : "Expandir"}
        >
          {filhos.length > 0 ? (
            aberto ? (
              <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            )
          ) : (
            <span className="inline-block h-4 w-4" />
          )}
        </button>
        <span className="flex-1 text-sm text-foreground">{topico.titulo}</span>
        <select
          value={topico.status}
          disabled={salvando}
          onChange={(e) => mudarStatus(e.target.value as StatusTopico)}
          className="rounded-control border border-border bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50"
        >
          <option value="nao_iniciado">{rotuloStatus.nao_iniciado}</option>
          <option value="em_estudo">{rotuloStatus.em_estudo}</option>
          <option value="revisado">{rotuloStatus.revisado}</option>
          <option value="consolidado" disabled={topico.contador_revisoes < 3}>
            {rotuloStatus.consolidado}
            {topico.contador_revisoes < 3 ? " (precisa de 3 revisões)" : ""}
          </option>
        </select>
        <button
          type="button"
          onClick={() => setMostrarSubtopico((v) => !v)}
          aria-label="Novo subtópico"
          className="text-text-secondary hover:text-primary"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
      {erro && <p className="ml-6 text-xs text-danger">{erro}</p>}
      {mostrarSubtopico && (
        <div className="ml-6">
          <TopicoForm
            disciplinaId={disciplinaId}
            topicoPaiId={topico.id}
            aoFechar={() => setMostrarSubtopico(false)}
          />
        </div>
      )}
      {aberto && filhos.length > 0 && (
        <ul className="ml-6 border-l border-border pl-2">
          {filhos.map((filho) => (
            <TopicoNode key={filho.id} topico={filho} todos={todos} disciplinaId={disciplinaId} />
          ))}
        </ul>
      )}
    </li>
  );
}
