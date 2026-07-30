import type { Tema } from "./theme";

export const rotuloCategoria: Record<string, string> = {
  lei_seca: "Lei Seca",
  doutrina: "Doutrina",
  jurisprudencia: "Jurisprudência",
  questoes: "Questões",
  revisao: "Revisão",
  redacao: "Redação",
};

export function coresCategoria(tema: Tema, categoria: string): { bg: string; text: string } {
  switch (categoria) {
    case "lei_seca":
      return { bg: tema.catLeiSecaBg, text: tema.catLeiSecaText };
    case "doutrina":
      return { bg: tema.catDoutrinaBg, text: tema.catDoutrinaText };
    case "questoes":
      return { bg: tema.catQuestoesBg, text: tema.catQuestoesText };
    case "jurisprudencia":
      return { bg: tema.catJurisprudenciaBg, text: tema.catJurisprudenciaText };
    default:
      return { bg: tema.surface, text: tema.foreground };
  }
}
