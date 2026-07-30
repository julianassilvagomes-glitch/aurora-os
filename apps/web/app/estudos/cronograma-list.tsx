import { createClient } from "@/lib/supabase/server";
import { CronogramaForm } from "./cronograma-form";
import { CronogramaSemana, diasDaSemanaAtual } from "./cronograma-semana";

export async function CronogramaList() {
  const supabase = await createClient();
  const dias = diasDaSemanaAtual(new Date());
  const primeiroDia = dias[0];
  const ultimoDia = dias[dias.length - 1];

  const [
    { data: disciplinas, error: erroDisciplinas },
    { data: topicos },
    { data: blocos, error: erroBlocos },
    { data: maisRecenteLista },
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
      .gte("data", primeiroDia)
      .lte("data", ultimoDia),
    supabase
      .from("bloco_cronograma")
      .select("disciplina_id")
      .order("data", { ascending: false })
      .limit(1),
  ]);

  if (erroDisciplinas) return <p className="text-sm text-danger">{erroDisciplinas.message}</p>;
  if (erroBlocos) return <p className="text-sm text-danger">{erroBlocos.message}</p>;

  // Ciclo de alternância: sugere a próxima disciplina na ordem_no_ciclo
  // depois da disciplina do bloco mais recente (ou a primeira, se ainda
  // não há nenhum bloco criado).
  let disciplinaSugeridaId: string | null = null;
  if (disciplinas?.length) {
    const maisRecente = maisRecenteLista?.[0] ?? null;
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
      <CronogramaSemana blocos={blocos ?? []} />
    </div>
  );
}
