import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useSincronizacao } from "../hooks/useSincronizacao";
import { categoriasEmCache, type Categoria } from "../lib/categorias";
import {
  criarLancamentoOffline,
  excluirLancamento,
  listarLancamentos,
  type LancamentoExibicao,
} from "../lib/lancamentos";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FinancasScreen() {
  const { online, sincronizando, pendentes, versao, sincronizarAgora, notificarMudancaLocal } =
    useSincronizacao();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoExibicao[]>([]);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    categoriasEmCache().then((c) => {
      setCategorias(c);
      setCategoriaId((atual) => atual ?? c[0]?.id ?? null);
    });
    listarLancamentos().then(setLancamentos);
  }, [versao]);

  async function adicionar() {
    setErro(null);
    const valorNumerico = Number(valor.replace(",", "."));
    if (!categoriaId) {
      setErro("Selecione uma categoria.");
      return;
    }
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro("Valor inválido.");
      return;
    }

    await criarLancamentoOffline({
      tipo,
      valor: valorNumerico,
      categoria_id: categoriaId,
      descricao: descricao.trim() || null,
      recorrente: false,
    });
    setValor("");
    setDescricao("");
    setLancamentos(await listarLancamentos());
    notificarMudancaLocal();
  }

  async function excluir(id: string) {
    await excluirLancamento(id);
    setLancamentos(await listarLancamentos());
    notificarMudancaLocal();
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Finanças</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.sair}>sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusLinha}>
        <View style={[styles.bolinha, { backgroundColor: online ? "#16a34a" : "#a1a1aa" }]} />
        <Text style={styles.statusTexto}>{online ? "online" : "offline"}</Text>
        {pendentes > 0 && (
          <Text style={styles.pendentesTexto}>· {pendentes} pendente(s)</Text>
        )}
        <TouchableOpacity onPress={sincronizarAgora} disabled={sincronizando} style={styles.syncBotao}>
          {sincronizando ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.syncTexto}>sincronizar agora</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.linha}>
          {(["despesa", "receita"] as const).map((opcao) => (
            <TouchableOpacity
              key={opcao}
              onPress={() => setTipo(opcao)}
              style={[styles.chip, tipo === opcao && styles.chipSelecionado]}
            >
              <Text style={tipo === opcao ? styles.chipTextoSelecionado : styles.chipTexto}>
                {opcao}
              </Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="valor"
            keyboardType="decimal-pad"
            value={valor}
            onChangeText={setValor}
          />
        </View>

        <FlatList
          horizontal
          data={categorias}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          style={styles.categoriasLista}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setCategoriaId(item.id)}
              style={[styles.chip, categoriaId === item.id && styles.chipSelecionado]}
            >
              <Text
                style={categoriaId === item.id ? styles.chipTextoSelecionado : styles.chipTexto}
              >
                {item.nome}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.vazioTexto}>
              nenhuma categoria em cache — conecte-se ao menos uma vez
            </Text>
          }
        />

        <TextInput
          style={styles.input}
          placeholder="descrição (opcional)"
          value={descricao}
          onChangeText={setDescricao}
        />

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <TouchableOpacity style={styles.botao} onPress={adicionar}>
          <Text style={styles.botaoTexto}>Adicionar lançamento</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lancamentos}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitulo}>
                {categorias.find((c) => c.id === item.categoria_id)?.nome ?? "—"}
                {item.descricao ? ` · ${item.descricao}` : ""}
              </Text>
              <Text style={styles.itemData}>
                {item.data}
                {item.pendente ? " · pendente de sincronização" : ""}
              </Text>
            </View>
            <Text
              style={[
                styles.itemValor,
                { color: item.tipo === "receita" ? "#16a34a" : "#dc2626" },
              ]}
            >
              {item.tipo === "receita" ? "+" : "-"}
              {formatarMoeda(item.valor)}
            </Text>
            <TouchableOpacity onPress={() => excluir(item.id)}>
              <Text style={styles.excluirTexto}>excluir</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vazioTexto}>Nenhum lançamento ainda.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16, gap: 12 },
  cabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titulo: { fontSize: 22, fontWeight: "600" },
  sair: { color: "#71717a", fontSize: 13 },
  statusLinha: { flexDirection: "row", alignItems: "center", gap: 6 },
  bolinha: { width: 8, height: 8, borderRadius: 4 },
  statusTexto: { fontSize: 12, color: "#52525b" },
  pendentesTexto: { fontSize: 12, color: "#52525b" },
  syncBotao: { marginLeft: "auto" },
  syncTexto: { fontSize: 12, color: "#2563eb" },
  form: { gap: 8, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 10, padding: 12 },
  linha: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoriasLista: { flexGrow: 0 },
  chip: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
  },
  chipSelecionado: { backgroundColor: "#18181b", borderColor: "#18181b" },
  chipTexto: { fontSize: 13, color: "#18181b" },
  chipTextoSelecionado: { fontSize: 13, color: "#fff" },
  erro: { color: "#dc2626", fontSize: 13 },
  botao: { backgroundColor: "#18181b", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  botaoTexto: { color: "#fff", fontWeight: "600", fontSize: 13 },
  lista: { gap: 8, paddingBottom: 32 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    padding: 10,
  },
  itemTitulo: { fontSize: 13, color: "#18181b" },
  itemData: { fontSize: 11, color: "#a1a1aa", marginTop: 2 },
  itemValor: { fontSize: 13, fontWeight: "600" },
  excluirTexto: { fontSize: 11, color: "#a1a1aa" },
  vazioTexto: { fontSize: 12, color: "#a1a1aa", padding: 8 },
});
