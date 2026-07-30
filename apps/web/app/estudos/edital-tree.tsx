import { createClient } from "@/lib/supabase/server";
import { TopicoNode, type Topico } from "./topico-node";
import { TopicoForm } from "./topico-form";
import { DisciplinaForm } from "./disciplina-form";

export async function EditalTree() {
  const supabase = await createClient();
  const [{ data: disciplinas, error: erroDisciplinas }, { data: topicos, error: erroTopicos }] =
    await Promise.all([
      supabase
        .from("disciplina")
        .select("id, nome, area, ordem_no_ciclo")
        .eq("ativa", true)
        .order("ordem_no_ciclo"),
      supabase
        .from("topico_edital")
        .select("id, titulo, status, contador_revisoes, topico_pai_id, incidencia, disciplina_id"),
    ]);

  if (erroDisciplinas) return <p className="text-sm text-danger">{erroDisciplinas.message}</p>;
  if (erroTopicos) return <p className="text-sm text-danger">{erroTopicos.message}</p>;

  return (
    <div className="flex flex-col gap-4">
      {disciplinas?.length ? (
        disciplinas.map((disciplina) => {
          const topicosDaDisciplina: Topico[] = (topicos ?? []).filter(
            (t) => t.disciplina_id === disciplina.id
          );
          const raizes = topicosDaDisciplina.filter((t) => t.topico_pai_id === null);

          return (
            <div
              key={disciplina.id}
              className="rounded-card border border-border bg-surface p-4"
            >
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="font-medium text-foreground">{disciplina.nome}</h3>
                <span className="text-xs text-text-secondary">{disciplina.area}</span>
              </div>
              <ul>
                {raizes.map((topico) => (
                  <TopicoNode
                    key={topico.id}
                    topico={topico}
                    todos={topicosDaDisciplina}
                    disciplinaId={disciplina.id}
                  />
                ))}
              </ul>
              <div className="mt-2">
                <TopicoForm disciplinaId={disciplina.id} topicoPaiId={null} />
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-text-secondary">Nenhuma disciplina cadastrada ainda.</p>
      )}

      <DisciplinaForm />
    </div>
  );
}
