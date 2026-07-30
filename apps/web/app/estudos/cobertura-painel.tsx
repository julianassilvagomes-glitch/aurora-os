import { createClient } from "@/lib/supabase/server";

/**
 * Cobertura nunca vira um número único de progresso — sempre os dois
 * lados: % tocado (já saiu do zero) e % consolidado. "Consolidado" aqui
 * usa a regra completa do documento (3+ revisões OU 80%+ de acerto em
 * 10+ questões), mais ampla que o campo topico.status = 'consolidado'
 * sozinho (que só a constraint do banco, contador_revisoes >= 3, cobre).
 */
export async function CoberturaPainel() {
  const supabase = await createClient();

  const [{ data: topicos, error: erroTopicos }, { data: questoes }] = await Promise.all([
    supabase.from("topico_edital").select("id, status"),
    supabase.from("questao").select("topico_id, resposta_questao(acertou)"),
  ]);

  if (erroTopicos) {
    return <p className="text-sm text-danger">{erroTopicos.message}</p>;
  }
  if (!topicos?.length) {
    return (
      <p className="text-sm text-text-secondary">
        Cadastre disciplinas e tópicos para ver a cobertura.
      </p>
    );
  }

  const estatisticaPorTopico = new Map<string, { total: number; acertos: number }>();
  for (const q of questoes ?? []) {
    const atual = estatisticaPorTopico.get(q.topico_id) ?? { total: 0, acertos: 0 };
    for (const r of q.resposta_questao ?? []) {
      atual.total += 1;
      if (r.acertou) atual.acertos += 1;
    }
    estatisticaPorTopico.set(q.topico_id, atual);
  }

  const total = topicos.length;
  const tocados = topicos.filter((t) => t.status !== "nao_iniciado").length;
  const consolidados = topicos.filter((t) => {
    if (t.status === "consolidado") return true;
    const estatistica = estatisticaPorTopico.get(t.id);
    if (!estatistica || estatistica.total < 10) return false;
    return estatistica.acertos / estatistica.total >= 0.8;
  }).length;

  const percentualTocado = Math.round((tocados / total) * 100);
  const percentualConsolidado = Math.round((consolidados / total) * 100);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-card border border-border bg-surface-primary p-4">
        <p className="text-xs text-text-secondary">Tocado</p>
        <p className="text-2xl font-semibold text-primary-dark">{percentualTocado}%</p>
        <p className="text-xs text-text-secondary">
          {tocados} de {total} tópicos
        </p>
      </div>
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-xs text-text-secondary">Consolidado</p>
        <p className="text-2xl font-semibold text-foreground">{percentualConsolidado}%</p>
        <p className="text-xs text-text-secondary">
          {consolidados} de {total} tópicos
        </p>
      </div>
    </div>
  );
}
