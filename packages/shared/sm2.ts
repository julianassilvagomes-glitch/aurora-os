/**
 * SM-2 simplificado: o schema de flashcard não guarda um contador de
 * repetições separado (só intervalo_atual_dias e fator_facilidade), então
 * os dois primeiros passos após um lapso usam degraus fixos pequenos em
 * vez da fórmula de multiplicação — evita que um cartão "De novo" ontem
 * pule direto pra um intervalo grande amanhã.
 */
export function calcularProximaRevisao(
  qualidade: number,
  intervaloAtualDias: number,
  fatorFacilidadeAtual: number
) {
  const novoFator = Math.max(
    1.3,
    fatorFacilidadeAtual + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02))
  );

  let novoIntervalo: number;
  if (qualidade < 3) {
    novoIntervalo = 1;
  } else if (intervaloAtualDias <= 1) {
    novoIntervalo = qualidade === 5 ? 4 : 3;
  } else {
    novoIntervalo = Math.round(intervaloAtualDias * novoFator);
  }

  return { novoIntervalo, novoFator };
}

export const QUALIDADE_POR_BOTAO = {
  de_novo: 1,
  dificil: 3,
  bom: 4,
  facil: 5,
} as const;

export type BotaoRevisao = keyof typeof QUALIDADE_POR_BOTAO;
