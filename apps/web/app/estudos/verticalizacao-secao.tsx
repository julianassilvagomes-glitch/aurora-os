"use client";

import { useState } from "react";
import {
  confirmarVerticalizacao,
  verticalizarComIA,
  type DisciplinaVerticalizada,
} from "./actions";
import { RevisaoVerticalizacao } from "./revisao-verticalizacao";

export function VerticalizacaoSecao() {
  const [texto, setTexto] = useState("");
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [revisao, setRevisao] = useState<DisciplinaVerticalizada[] | null>(null);

  async function verticalizar() {
    setErro(null);
    setSucesso(false);
    if (!texto.trim()) {
      setErro("Cole o texto do edital primeiro.");
      return;
    }
    setProcessando(true);
    const formData = new FormData();
    formData.set("texto_bruto", texto);
    const resultado = await verticalizarComIA({ error: null, resultado: null }, formData);
    setProcessando(false);
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }
    setRevisao(resultado.resultado ?? []);
  }

  async function confirmar() {
    if (!revisao) return;
    setSalvando(true);
    setErro(null);
    const resultado = await confirmarVerticalizacao({ disciplinas: revisao });
    setSalvando(false);
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }
    setRevisao(null);
    setTexto("");
    setSucesso(true);
  }

  if (revisao) {
    return (
      <RevisaoVerticalizacao
        disciplinas={revisao}
        onChange={setRevisao}
        onConfirmar={confirmar}
        onDescartar={() => setRevisao(null)}
        salvando={salvando}
        erro={erro}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <p className="text-xs text-text-secondary">
        Cole o texto bruto de um edital. A IA organiza disciplinas e tópicos em Lei Seca e
        Doutrina — nada é salvo até você revisar e confirmar na próxima tela.
      </p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        placeholder="cole o texto do edital aqui"
        className="rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      {erro && <p className="text-sm text-danger">{erro}</p>}
      {sucesso && <p className="text-sm text-success">Verticalização salva.</p>}
      <button
        type="button"
        onClick={verticalizar}
        disabled={processando}
        className="self-start rounded-control bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {processando ? "Verticalizando..." : "Verticalizar com IA"}
      </button>
    </div>
  );
}
