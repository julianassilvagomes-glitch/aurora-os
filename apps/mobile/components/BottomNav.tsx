import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Wallet, BookOpen } from "lucide-react-native";
import { useTema, type Tema } from "../lib/theme";

export const ALTURA_NAV = 64;

export type Aba = "financas" | "estudos";

const abas: { chave: Aba; rotulo: string; Icone: typeof Wallet }[] = [
  { chave: "financas", rotulo: "Finanças", Icone: Wallet },
  { chave: "estudos", rotulo: "Estudos", Icone: BookOpen },
];

export function BottomNav({ ativa, aoSelecionar }: { ativa: Aba; aoSelecionar: (aba: Aba) => void }) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  return (
    <View style={estilos.container}>
      {abas.map(({ chave, rotulo, Icone }) => {
        const selecionada = ativa === chave;
        return (
          <TouchableOpacity key={chave} onPress={() => aoSelecionar(chave)} style={estilos.item}>
            <Icone
              color={selecionada ? tema.primary : tema.textSecondary}
              size={20}
              strokeWidth={1.75}
            />
            <Text style={[estilos.rotulo, selecionada && { color: tema.primary, fontWeight: "600" }]}>
              {rotulo}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      height: ALTURA_NAV,
      borderTopWidth: 1,
      borderTopColor: tema.border,
      backgroundColor: tema.surface,
    },
    item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
    rotulo: { fontSize: 11, color: tema.textSecondary },
  });
}
