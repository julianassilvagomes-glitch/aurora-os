export const rotuloCategoria: Record<string, string> = {
  lei_seca: "Lei Seca",
  doutrina: "Doutrina",
  jurisprudencia: "Jurisprudência",
  questoes: "Questões",
  revisao: "Revisão",
  redacao: "Redação",
};

/** Fundo suave por categoria, sempre dentro da paleta azul-sóbria — sem cores saturadas. */
export function coresCategoria(categoria: string): { bg: string; text: string } {
  switch (categoria) {
    case "lei_seca":
      return { bg: "bg-cat-lei-seca-bg", text: "text-cat-lei-seca-text" };
    case "doutrina":
      return { bg: "bg-cat-doutrina-bg", text: "text-cat-doutrina-text" };
    case "questoes":
      return { bg: "bg-cat-questoes-bg", text: "text-cat-questoes-text" };
    case "jurisprudencia":
      return { bg: "bg-cat-jurisprudencia-bg", text: "text-cat-jurisprudencia-text" };
    default:
      return { bg: "bg-surface", text: "text-foreground" };
  }
}
