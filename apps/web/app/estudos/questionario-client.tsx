"use client";

import { useMemo, useState } from "react";
import { responderQuestao } from "./actions";

type Questao = {
  id: string;
  enunciado: string;
  gabarito: string;
  banca: string | null;
  ano: number | null;
  respondida: boolean;
};

const motivos = [
  { valor: "desconhecimento", rotulo: "desconhecimento" },
  { valor: "pegadinha", rotulo: "pegadinha" },
  { valor: "interpretacao", rotulo: "interpretação" },
  { valor: "distracao", rotulo: "distração" },
];

export function QuestionarioClient({
  topicoTitulo,
  questoes,
}: {
  topicoTitulo: string;
  questoes: Questao[];
}) {
  const pendentes = useMemo(() => questoes.filter((q) => !q.respondida), [questoes]);
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [respondidasNestaSessao, setRespondidasNestaSessao] = useState(0);

  const questaoAtual = pendentes[indice];

  async function responder(acertou: boolean) {
    if (!questaoAtual) return;
    if (!acertou && !motivo) {
      setErro("Selecione o motivo do erro.");
      return;
    }
    setEnviando(true);
    setErro(null);

    const formData = new FormData();
    formData.set("questao_id", questaoAtual.id);
    formData.set("acertou", acertou ? "true" : "false");
    if (!acertou) formData.set("motivo_erro", motivo);

    const resultado = await responderQuestao({ error: null }, formData);
    setEnviando(false);
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }

    setRespondidasNestaSessao((n) => n + 1);
    setRevelado(false);
    setMotivo("");
    setIndice((i) => i + 1);
  }

  if (!questoes.length) {
    return (
      <p className="text-sm text-text-secondary">
        Nenhuma questão cadastrada para {topicoTitulo} ainda.
      </p>
    );
  }

  if (!questaoAtual) {
    return (
      <p className="text-sm text-success">
        {respondidasNestaSessao > 0
          ? `Sem mais questões pendentes em ${topicoTitulo} por agora.`
          : `Todas as questões de ${topicoTitulo} já foram respondidas.`}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <p className="text-xs text-text-secondary">
        {topicoTitulo} · {pendentes.length - indice} pendente(s)
        {questaoAtual.banca ? ` · ${questaoAtual.banca}` : ""}
        {questaoAtual.ano ? ` · ${questaoAtual.ano}` : ""}
      </p>
      <p className="text-sm text-foreground">{questaoAtual.enunciado}</p>

      {revelado ? (
        <>
          <p className="rounded-control bg-background p-3 text-sm text-text-secondary">
            <span className="font-medium text-foreground">Gabarito: </span>
            {questaoAtual.gabarito}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => responder(true)}
              disabled={enviando}
              className="rounded-control bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Acertei
            </button>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="rounded-control border border-border bg-background px-2 py-2 text-sm text-foreground"
            >
              <option value="">motivo do erro</option>
              {motivos.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.rotulo}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => responder(false)}
              disabled={enviando}
              className="rounded-control border border-border px-3 py-2 text-sm text-danger disabled:opacity-50"
            >
              Errei
            </button>
          </div>
          {erro && <p className="text-sm text-danger">{erro}</p>}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setRevelado(true)}
          className="self-start rounded-control border border-border px-3 py-2 text-sm text-primary"
        >
          Revelar gabarito
        </button>
      )}
    </div>
  );
}
