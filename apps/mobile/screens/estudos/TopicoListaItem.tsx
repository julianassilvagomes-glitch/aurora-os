import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TopicoNode } from "./TopicoNode";
import type { Topico } from "../../lib/estudos";
import { useTema, raioControle, type Tema } from "../../lib/theme";

export function TopicoListaItem({
  numero,
  proximo,
  topico,
  todos,
  disciplinaId,
  aoMudar,
}: {
  numero: number;
  proximo: boolean;
  topico: Topico;
  todos: Topico[];
  disciplinaId: string;
  aoMudar: () => void;
}) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  return (
    <View style={[estilos.item, proximo && estilos.itemProximo]}>
      <View style={estilos.linha}>
        <Text style={estilos.numero}>{numero}.</Text>
        <View style={{ flex: 1 }}>
          {proximo && (
            <Text style={estilos.badgeProximo}>PRÓXIMO</Text>
          )}
          <TopicoNode topico={topico} todos={todos} disciplinaId={disciplinaId} aoMudar={aoMudar} />
        </View>
      </View>
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    item: { paddingHorizontal: 4 },
    itemProximo: {
      borderWidth: 1,
      borderColor: tema.primary,
      backgroundColor: tema.surfacePrimary,
      borderRadius: raioControle,
    },
    linha: { flexDirection: "row", alignItems: "flex-start", gap: 4, paddingTop: 4 },
    numero: { width: 18, textAlign: "right", fontSize: 11, color: tema.textSecondary, marginTop: 5 },
    badgeProximo: {
      alignSelf: "flex-start",
      fontSize: 9,
      fontWeight: "700",
      color: "#fff",
      backgroundColor: tema.primary,
      borderRadius: raioControle,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 2,
      letterSpacing: 0.5,
    },
  });
}
