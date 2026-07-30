"use client";

import { useState } from "react";
import { revisarFlashcard, type BotaoRevisao } from "./actions";

type Flashcard = {
  id: string;
  frente: string;
  verso: string;
  topico: { titulo: string } | null;
};

const botoes: { botao: BotaoRevisao; rotulo: string }[] = [
  { botao: "de_novo", rotulo: "De novo" },
  { botao: "dificil", rotulo: "Difícil" },
  { botao: "bom", rotulo: "Bom" },
  { botao: "facil", rotulo: "Fácil" },
];

export function FlashcardReview({ fila }: { fila: Flashcard[] }) {
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [revisadosNestaSessao, setRevisadosNestaSessao] = useState(0);

  const cartaoAtual = fila[indice];

  async function avaliar(botao: BotaoRevisao) {
    if (!cartaoAtual) return;
    setEnviando(true);
    await revisarFlashcard(cartaoAtual.id, botao);
    setEnviando(false);
    setRevisadosNestaSessao((n) => n + 1);
    setRevelado(false);
    setIndice((i) => i + 1);
  }

  if (!fila.length) {
    return <p className="text-sm text-text-secondary">Nenhum flashcard para revisar hoje.</p>;
  }

  if (!cartaoAtual) {
    return (
      <p className="text-sm text-success">
        Fila do dia concluída — {revisadosNestaSessao} cartão(ões) revisado(s).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6">
      <p className="text-xs text-text-secondary">
        {cartaoAtual.topico?.titulo ?? "—"} · {fila.length - indice} restante(s)
      </p>
      <p className="text-center text-lg text-foreground">{cartaoAtual.frente}</p>

      {revelado ? (
        <>
          <p className="rounded-control bg-background p-3 text-center text-sm text-text-secondary">
            {cartaoAtual.verso}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {botoes.map(({ botao, rotulo }) => (
              <button
                key={botao}
                type="button"
                disabled={enviando}
                onClick={() => avaliar(botao)}
                className={
                  botao === "bom"
                    ? "rounded-control bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
                    : "rounded-control border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50"
                }
              >
                {rotulo}
              </button>
            ))}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setRevelado(true)}
          className="self-center rounded-control border border-border px-3 py-2 text-sm text-primary"
        >
          Virar cartão
        </button>
      )}
    </div>
  );
}
