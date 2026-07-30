"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuestionarioClient } from "./questionario-client";
import { QuestaoForm } from "./questao-form";

type Topico = { id: string; titulo: string };

export function QuestoesSecao() {
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [topicoId, setTopicoId] = useState("");
  const [questoes, setQuestoes] = useState<
    { id: string; enunciado: string; gabarito: string; banca: string | null; ano: number | null; respondida: boolean }[]
  >([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("topico_edital")
      .select("id, titulo")
      .order("titulo")
      .then(({ data }) => setTopicos(data ?? []));
  }, []);

  useEffect(() => {
    if (!topicoId) {
      setQuestoes([]);
      return;
    }
    setCarregando(true);
    const supabase = createClient();
    supabase
      .from("questao")
      .select("id, enunciado, gabarito, banca, ano, resposta_questao(id)")
      .eq("topico_id", topicoId)
      .then(({ data }) => {
        setQuestoes(
          (data ?? []).map((q) => ({
            id: q.id,
            enunciado: q.enunciado,
            gabarito: q.gabarito,
            banca: q.banca,
            ano: q.ano,
            respondida: (q.resposta_questao?.length ?? 0) > 0,
          }))
        );
        setCarregando(false);
      });
  }, [topicoId]);

  const topicoSelecionado = topicos.find((t) => t.id === topicoId);

  return (
    <div className="flex flex-col gap-3">
      <select
        value={topicoId}
        onChange={(e) => setTopicoId(e.target.value)}
        className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground"
      >
        <option value="">Selecione um tópico para responder questões</option>
        {topicos.map((t) => (
          <option key={t.id} value={t.id}>
            {t.titulo}
          </option>
        ))}
      </select>

      {carregando && <p className="text-sm text-text-secondary">Carregando…</p>}

      {topicoSelecionado && !carregando && (
        <QuestionarioClient topicoTitulo={topicoSelecionado.titulo} questoes={questoes} />
      )}

      <QuestaoForm topicos={topicos} />
    </div>
  );
}
