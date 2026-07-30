import { TopicoListaItem } from "./topico-lista-item";
import { TopicoForm } from "./topico-form";
import type { Topico } from "./topico-node";

function ListaTopicos({
  titulo,
  raizes,
  todos,
  disciplinaId,
  tipoConteudo,
}: {
  titulo: string;
  raizes: Topico[];
  todos: Topico[];
  disciplinaId: string;
  tipoConteudo: "lei_seca" | "doutrina";
}) {
  const ordenados = [...raizes].sort((a, b) => a.ordem_na_lista - b.ordem_na_lista);
  const tocados = ordenados.filter((t) => t.status !== "nao_iniciado").length;
  const proximoId = ordenados.find((t) => t.status === "nao_iniciado")?.id ?? null;

  return (
    <div className="flex-1">
      <div className="mb-1 flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-foreground">{titulo}</h4>
        <span className="text-xs text-text-secondary">
          {tocados}/{ordenados.length}
        </span>
      </div>
      {ordenados.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {ordenados.map((topico, indice) => (
            <TopicoListaItem
              key={topico.id}
              numero={indice + 1}
              proximo={topico.id === proximoId}
              topico={topico}
              todos={todos}
              disciplinaId={disciplinaId}
            />
          ))}
        </ol>
      ) : (
        <p className="px-2 py-1 text-xs text-text-secondary">Nenhum item ainda.</p>
      )}
      <div className="mt-1 px-2">
        <TopicoForm disciplinaId={disciplinaId} topicoPaiId={null} tipoConteudo={tipoConteudo} />
      </div>
    </div>
  );
}

export function DisciplinaCard({
  disciplina,
  topicos,
}: {
  disciplina: { id: string; nome: string; area: string };
  topicos: Topico[];
}) {
  const raizes = topicos.filter((t) => t.topico_pai_id === null);
  const raizesLeiSeca = raizes.filter((t) => t.tipo_conteudo === "lei_seca");
  const raizesDoutrina = raizes.filter((t) => t.tipo_conteudo === "doutrina");

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-medium text-foreground">{disciplina.nome}</h3>
        <span className="text-xs text-text-secondary">{disciplina.area}</span>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <ListaTopicos
          titulo="Lei Seca"
          raizes={raizesLeiSeca}
          todos={topicos}
          disciplinaId={disciplina.id}
          tipoConteudo="lei_seca"
        />
        <ListaTopicos
          titulo="Doutrina"
          raizes={raizesDoutrina}
          todos={topicos}
          disciplinaId={disciplina.id}
          tipoConteudo="doutrina"
        />
      </div>
    </div>
  );
}
