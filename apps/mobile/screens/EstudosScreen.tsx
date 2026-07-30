import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CoberturaPainel } from "./estudos/CoberturaPainel";
import { EditalTree } from "./estudos/EditalTree";
import { CronogramaSecao } from "./estudos/CronogramaSecao";
import { QuestoesSecao } from "./estudos/QuestoesSecao";
import { FlashcardsSecao } from "./estudos/FlashcardsSecao";
import { useTema, type Tema } from "../lib/theme";

export function EstudosScreen() {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);
  const [versao, setVersao] = useState(0);

  const aoMudar = useCallback(() => setVersao((v) => v + 1), []);

  return (
    <ScrollView
      style={estilos.container}
      contentContainerStyle={estilos.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Estudos</Text>

      <CoberturaPainel versao={versao} />

      <View>
        <Text style={estilos.secaoTitulo}>Edital verticalizado</Text>
        <EditalTree versao={versao} aoMudar={aoMudar} />
      </View>

      <View>
        <Text style={estilos.secaoTitulo}>Cronograma</Text>
        <CronogramaSecao versao={versao} aoMudar={aoMudar} />
      </View>

      <View>
        <Text style={estilos.secaoTitulo}>Banco de questões</Text>
        <QuestoesSecao />
      </View>

      <View>
        <Text style={estilos.secaoTitulo}>Flashcards — fila do dia</Text>
        <FlashcardsSecao versao={versao} aoMudar={aoMudar} />
      </View>
    </ScrollView>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: tema.background },
    conteudo: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
    titulo: { fontSize: 22, fontWeight: "600", color: tema.primaryDark },
    secaoTitulo: { fontSize: 12, fontWeight: "600", color: tema.textSecondary, marginBottom: 6 },
  });
}
