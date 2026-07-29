import { useEffect, useMemo, useState } from "react";
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
import { raioCard, raioControle, useTema, type Tema } from "../lib/theme";

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

  function estiloChip(selecionado: boolean) {
    return [estilos.chip, selecionado && estilos.chipSelecionado];
  }

  function textoChip(selecionado: boolean) {
    return selecionado ? estilos.chipTextoSelecionado : estilos.chipTexto;
  }

  return (
    <View style={estilos.container}>
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

      <View style={estilos.form}>
        <View style={estilos.linha}>
          {(["despesa", "receita"] as const).map((opcao) => (
            <TouchableOpacity
              key={opcao}
              onPress={() => setTipo(opcao)}
              style={estiloChip(tipo === opcao)}
            >
              <Text style={textoChip(tipo === opcao)}>{opcao}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={[estilos.input, { flex: 1 }]}
            placeholder="valor"
            placeholderTextColor={tema.textSecondary}
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
          style={estilos.categoriasLista}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setCategoriaId(item.id)}
              style={estiloChip(categoriaId === item.id)}
            >
              <Text style={textoChip(categoriaId === item.id)}>{item.nome}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={estilos.vazioTexto}>
              nenhuma categoria em cache — conecte-se ao menos uma vez
            </Text>
          }
        />

        <TextInput
          style={estilos.input}
          placeholder="descrição (opcional)"
          placeholderTextColor={tema.textSecondary}
          value={descricao}
          onChangeText={setDescricao}
        />

        {erro && <Text style={estilos.erro}>{erro}</Text>}

        <TouchableOpacity style={estilos.botao} onPress={adicionar}>
          <Text style={estilos.botaoTexto}>Adicionar lançamento</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lancamentos}
        keyExtractor={(l) => l.id}
        contentContainerStyle={estilos.lista}
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
      />
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 56,
      paddingHorizontal: 16,
      gap: 12,
      backgroundColor: tema.background,
    },
    cabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    titulo: { fontSize: 22, fontWeight: "600", color: tema.primaryDark },
    sair: { color: tema.textSecondary, fontSize: 13 },
    statusLinha: { flexDirection: "row", alignItems: "center", gap: 6 },
    bolinha: { width: 8, height: 8, borderRadius: 4 },
    statusTexto: { fontSize: 12, color: tema.textSecondary },
    pendentesTexto: { fontSize: 12, color: tema.textSecondary },
    syncBotao: { marginLeft: "auto" },
    syncTexto: { fontSize: 12, color: tema.primary, fontWeight: "600" },
    form: {
      gap: 8,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 12,
    },
    linha: { flexDirection: "row", gap: 8, alignItems: "center" },
    input: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.background,
      color: tema.foreground,
      borderRadius: raioControle,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    categoriasLista: { flexGrow: 0 },
    chip: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioControle,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 6,
    },
    chipSelecionado: { backgroundColor: tema.primary, borderColor: tema.primary },
    chipTexto: { fontSize: 13, color: tema.foreground },
    chipTextoSelecionado: { fontSize: 13, color: "#fff", fontWeight: "600" },
    erro: { color: tema.danger, fontSize: 13 },
    botao: {
      backgroundColor: tema.primary,
      borderRadius: raioControle,
      paddingVertical: 10,
      alignItems: "center",
    },
    botaoTexto: { color: "#fff", fontWeight: "600", fontSize: 13 },
    lista: { gap: 8, paddingBottom: 32 },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 10,
    },
    itemTitulo: { fontSize: 13, color: tema.foreground },
    itemData: { fontSize: 11, color: tema.textSecondary, marginTop: 2 },
    pendenteTag: { color: tema.warning },
    itemValor: { fontSize: 14, fontWeight: "700", color: tema.foreground },
    excluirTexto: { fontSize: 11, color: tema.textSecondary },
    vazioTexto: { fontSize: 12, color: tema.textSecondary, padding: 8 },
  });
}
