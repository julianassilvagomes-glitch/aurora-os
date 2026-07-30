import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { calcularCobertura, type Cobertura } from "../../lib/estudos";
import { useTema, raioCard, type Tema } from "../../lib/theme";

export function CoberturaPainel({ versao }: { versao: number }) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);
  const [cobertura, setCobertura] = useState<Cobertura | null>(null);

  useEffect(() => {
    calcularCobertura().then(setCobertura);
  }, [versao]);

  if (!cobertura) {
    return (
      <Text style={estilos.vazio}>
        Cadastre disciplinas e tópicos para ver a cobertura.
      </Text>
    );
  }

  return (
    <View style={estilos.linha}>
      <View style={[estilos.card, { backgroundColor: tema.surfacePrimary }]}>
        <Text style={estilos.rotulo}>Tocado</Text>
        <Text style={[estilos.valor, { color: tema.primaryDark }]}>
          {cobertura.percentualTocado}%
        </Text>
        <Text style={estilos.legenda}>
          {cobertura.tocados} de {cobertura.total} tópicos
        </Text>
      </View>
      <View style={[estilos.card, { backgroundColor: tema.surface, borderWidth: 1, borderColor: tema.border }]}>
        <Text style={estilos.rotulo}>Consolidado</Text>
        <Text style={[estilos.valor, { color: tema.foreground }]}>
          {cobertura.percentualConsolidado}%
        </Text>
        <Text style={estilos.legenda}>
          {cobertura.consolidados} de {cobertura.total} tópicos
        </Text>
      </View>
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    linha: { flexDirection: "row", gap: 8 },
    card: { flex: 1, borderRadius: raioCard, padding: 14 },
    rotulo: { fontSize: 11, color: tema.textSecondary },
    valor: { fontSize: 22, fontWeight: "700", marginTop: 2 },
    legenda: { fontSize: 11, color: tema.textSecondary, marginTop: 2 },
    vazio: { fontSize: 12, color: tema.textSecondary },
  });
}
