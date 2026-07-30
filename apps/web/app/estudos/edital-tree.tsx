import { createClient } from "@/lib/supabase/server";
import { DisciplinaCard } from "./disciplina-card";
import { DisciplinaForm } from "./disciplina-form";
import type { Topico } from "./topico-node";

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
        .select(
          "id, titulo, status, contador_revisoes, topico_pai_id, incidencia, disciplina_id, tipo_conteudo, ordem_na_lista"
        ),
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
          return (
            <DisciplinaCard
              key={disciplina.id}
              disciplina={disciplina}
              topicos={topicosDaDisciplina}
            />
          );
        })
      ) : (
        <p className="text-sm text-text-secondary">Nenhuma disciplina cadastrada ainda.</p>
      )}

      <DisciplinaForm />
    </div>
  );
}
