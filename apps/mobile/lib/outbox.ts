import * as Crypto from "expo-crypto";
import { readJson, writeJson } from "./storage";

const OUTBOX_KEY = "aurora:outbox";

export type OperacaoFila = "criar" | "atualizar" | "excluir";

export type AcaoFila = {
  chave: string;
  entidade: string;
  operacao: OperacaoFila;
  payload: Record<string, unknown>;
  criadaEm: string;
};

export function gerarId(): string {
  return Crypto.randomUUID();
}

export async function lerFila(): Promise<AcaoFila[]> {
  return readJson<AcaoFila[]>(OUTBOX_KEY, []);
}

async function salvarFila(fila: AcaoFila[]): Promise<void> {
  await writeJson(OUTBOX_KEY, fila);
}

export async function enfileirar(acao: AcaoFila): Promise<void> {
  const fila = await lerFila();
  fila.push(acao);
  await salvarFila(fila);
}

export async function removerDaFila(chave: string): Promise<void> {
  const fila = await lerFila();
  await salvarFila(fila.filter((a) => a.chave !== chave));
}

/** Remove uma ação de "criar" ainda não sincronizada (o registro nunca existiu no servidor). */
export async function descartarCriacaoLocal(idEntidade: string): Promise<boolean> {
  const fila = await lerFila();
  const restante = fila.filter(
    (a) => !(a.operacao === "criar" && a.payload.id === idEntidade)
  );
  const removeu = restante.length !== fila.length;
  if (removeu) await salvarFila(restante);
  return removeu;
}
