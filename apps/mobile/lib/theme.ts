import { useColorScheme } from "react-native";

/** Espelha os tokens de apps/web/app/globals.css — mesma paleta, mesma hierarquia de significado. */
const claro = {
  background: "#f5f8fc",
  surface: "#ffffff",
  surfacePrimary: "#eaf1fa",
  foreground: "#1c2430",
  textSecondary: "#64748b",
  border: "#e2e8f0",
  primary: "#2f5da8",
  primaryDark: "#14243d",
  danger: "#b3413b",
  warning: "#b7791f",
  success: "#4b8063",

  /* Exceção deliberada ao "nenhuma cor decorativa": só o par
     receita/despesa do módulo de Finanças. */
  receitaBg: "#e3f2e9",
  receitaText: "#1e6b43",
  despesaBg: "#fbe9e7",
  despesaText: "#a3352c",

  /* Categorias do Cronograma da semana — variações dentro do azul-sóbrio. */
  catLeiSecaBg: "#e4ecfa",
  catLeiSecaText: "#1f3c73",
  catDoutrinaBg: "#eae7f9",
  catDoutrinaText: "#372f6b",
  catQuestoesBg: "#e1f0fa",
  catQuestoesText: "#164866",
  catJurisprudenciaBg: "#dde6f5",
  catJurisprudenciaText: "#24345c",
};

const escuro = {
  background: "#0b0f14",
  surface: "#161c24",
  surfacePrimary: "#1b2836",
  foreground: "#e5e9ef",
  textSecondary: "#94a3b8",
  border: "#2a3341",
  primary: "#5b8def",
  primaryDark: "#9dc0ee",
  danger: "#c2726d",
  warning: "#d1a056",
  success: "#7fae93",

  receitaBg: "#16301f",
  receitaText: "#7fc79b",
  despesaBg: "#331e1c",
  despesaText: "#e0968f",

  catLeiSecaBg: "#1c2a4a",
  catLeiSecaText: "#a9c1ec",
  catDoutrinaBg: "#26214a",
  catDoutrinaText: "#c3b8ec",
  catQuestoesBg: "#123244",
  catQuestoesText: "#9bd4e8",
  catJurisprudenciaBg: "#1e2740",
  catJurisprudenciaText: "#b0c1e8",
};

export type Tema = typeof claro;

export function useTema(): Tema {
  const esquema = useColorScheme();
  return esquema === "dark" ? escuro : claro;
}

/** Cantos levemente arredondados, consistentes em toda a interface. */
export const raioCard = 10;
export const raioControle = 8;
