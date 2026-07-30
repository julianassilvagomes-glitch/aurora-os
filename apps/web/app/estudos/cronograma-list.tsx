import { createClient } from "@/lib/supabase/server";
import { CronogramaForm } from "./cronograma-form";
import { BlocoItem } from "./bloco-item";

export async function CronogramaList() {
  const supabase = await createClient();

  const [
    { data: disciplinas, error: erroDisciplinas },
    { data: topicos },
    { data: blocos, error: erroBlocos },
  ] = await Promise.all([
    supabase
      .from("disciplina")
      .select("id, nome, ordem_no_ciclo")
      .eq("ativa", true)
      .order("ordem_no_ciclo"),
    supabase.from("topico_edital").select("id, titulo, disciplina_id"),
    supabase
      .from("bloco_cronograma")
      .select(
        "id, data, categoria, status, duracao_planejada_min, disciplina_id, disciplina:disciplina_id(nome), topico:topico_id(titulo)"
      )
      .order("data", { ascending: false })
      .limit(30),
  ]);

  if (erroDisciplinas) return <p className="text-sm text-danger">{erroDisciplinas.message}</p>;
  if (erroBlocos) return <p className="text-sm text-danger">{erroBlocos.message}</p>;

  // Ciclo de alternância: sugere a próxima disciplina na ordem_no_ciclo
  // depois da disciplina do bloco mais recente (ou a primeira, se ainda
  // não há nenhum bloco criado).
  let disciplinaSugeridaId: string | null = null;
  if (disciplinas?.length) {
    const maisRecente = [...(blocos ?? [])].sort((a, b) => b.data.localeCompare(a.data))[0];
    if (!maisRecente) {
      disciplinaSugeridaId = disciplinas[0].id;
    } else {
      const indiceAtual = disciplinas.findIndex((d) => d.id === maisRecente.disciplina_id);
      disciplinaSugeridaId =
        indiceAtual >= 0
          ? disciplinas[(indiceAtual + 1) % disciplinas.length].id
          : disciplinas[0].id;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <CronogramaForm
        disciplinas={disciplinas ?? []}
        topicos={topicos ?? []}
        disciplinaSugeridaId={disciplinaSugeridaId}
      />
      {blocos?.length ? (
        <ul className="flex flex-col gap-2">
          {blocos.map((bloco) => (
            <BlocoItem key={bloco.id} bloco={bloco} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary">Nenhum bloco no cronograma ainda.</p>
      )}
    </div>
  );
}
