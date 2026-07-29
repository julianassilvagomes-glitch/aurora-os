import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useSincronizacao } from "../hooks/useSincronizacao";
import { categoriasEmCache, type Categoria } from "../lib/categorias";
import { excluirLancamento, listarLancamentos, type LancamentoExibicao } from "../lib/lancamentos";
import { raioCard, useTema, type Tema } from "../lib/theme";
import { SaldoResumo } from "./financas/SaldoResumo";
import { CategoriaSection } from "./financas/CategoriaSection";
import { LancamentoOverlay } from "./financas/LancamentoOverlay";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FinancasScreen() {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  const { online, sincronizando, pendentes, versao, sincronizarAgora, notificarMudancaLocal } =
    useSincronizacao();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoExibicao[]>([]);

  useEffect(() => {
    categoriasEmCache().then(setCategorias);
    listarLancamentos().then(setLancamentos);
  }, [versao]);

  async function excluir(id: string) {
    await excluirLancamento(id);
    setLancamentos(await listarLancamentos());
    notificarMudancaLocal();
  }

  return (
    <View style={estilos.raiz}>
      <FlatList
        style={estilos.container}
        contentContainerStyle={estilos.conteudo}
        data={lancamentos}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <View style={estilos.cabecalho}>
              <Text style={estilos.titulo}>Finanças</Text>
              <TouchableOpacity onPress={() => supabase.auth.signOut()}>
                <Text style={estilos.sair}>sair</Text>
              </TouchableOpacity>
            </View>

            <View style={estilos.statusLinha}>
              <View
                style={[
                  estilos.bolinha,
                  { backgroundColor: online ? tema.success : tema.textSecondary },
                ]}
              />
              <Text style={estilos.statusTexto}>{online ? "online" : "offline"}</Text>
              {pendentes > 0 && (
                <Text style={estilos.pendentesTexto}>· {pendentes} pendente(s)</Text>
              )}
              <TouchableOpacity
                onPress={sincronizarAgora}
                disabled={sincronizando}
                style={estilos.syncBotao}
              >
                {sincronizando ? (
                  <ActivityIndicator size="small" color={tema.primary} />
                ) : (
                  <Text style={estilos.syncTexto}>sincronizar agora</Text>
                )}
              </TouchableOpacity>
            </View>

            <SaldoResumo versao={versao} />

            <View>
              <Text style={estilos.secaoTitulo}>Categorias</Text>
              <CategoriaSection versao={versao} aoMudar={notificarMudancaLocal} />
            </View>

            <Text style={estilos.secaoTitulo}>Últimos lançamentos</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={estilos.item}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.itemTitulo}>
                {categorias.find((c) => c.id === item.categoria_id)?.nome ?? "—"}
                {item.descricao ? ` · ${item.descricao}` : ""}
              </Text>
              <Text style={estilos.itemData}>
                {item.data}
                {item.pendente ? (
                  <Text style={estilos.pendenteTag}> · pendente de sincronização</Text>
                ) : null}
              </Text>
            </View>
            <Text style={estilos.itemValor}>
              {item.tipo === "receita" ? "+" : "-"}
              {formatarMoeda(item.valor)}
            </Text>
            <TouchableOpacity onPress={() => excluir(item.id)}>
              <Text style={estilos.excluirTexto}>excluir</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={estilos.vazioTexto}>Nenhum lançamento ainda.</Text>}
        ListFooterComponent={<View style={{ height: 96 }} />}
      />

      <LancamentoOverlay categorias={categorias} aoCriar={notificarMudancaLocal} />
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    raiz: { flex: 1, backgroundColor: tema.background },
    container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
    conteudo: { gap: 8, paddingBottom: 16 },
    cabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    titulo: { fontSize: 22, fontWeight: "600", color: tema.primaryDark },
    sair: { color: tema.textSecondary, fontSize: 13 },
    statusLinha: { flexDirection: "row", alignItems: "center", gap: 6 },
    bolinha: { width: 8, height: 8, borderRadius: 4 },
    statusTexto: { fontSize: 12, color: tema.textSecondary },
    pendentesTexto: { fontSize: 12, color: tema.textSecondary },
    syncBotao: { marginLeft: "auto" },
    syncTexto: { fontSize: 12, color: tema.primary, fontWeight: "600" },
    secaoTitulo: { fontSize: 12, fontWeight: "600", color: tema.textSecondary, marginBottom: 6 },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 10,
      marginBottom: 8,
    },
    itemTitulo: { fontSize: 13, color: tema.foreground },
    itemData: { fontSize: 11, color: tema.textSecondary, marginTop: 2 },
    pendenteTag: { color: tema.warning },
    itemValor: { fontSize: 14, fontWeight: "700", color: tema.foreground },
    excluirTexto: { fontSize: 11, color: tema.textSecondary },
    vazioTexto: { fontSize: 12, color: tema.textSecondary, padding: 8 },
  });
}
