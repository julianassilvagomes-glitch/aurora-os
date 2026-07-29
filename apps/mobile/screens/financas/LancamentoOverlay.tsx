import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Plus, X } from "lucide-react-native";
import { criarLancamentoOffline } from "../../lib/lancamentos";
import type { Categoria } from "../../lib/categorias";
import { useTema, raioCard, raioControle, type Tema } from "../../lib/theme";

export function LancamentoOverlay({
  categorias,
  aoCriar,
}: {
  categorias: Categoria[];
  aoCriar: () => void;
}) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  const [aberto, setAberto] = useState(false);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function abrir() {
    setCategoriaId((atual) => atual ?? categorias[0]?.id ?? null);
    setErro(null);
    setAberto(true);
  }

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
    setAberto(false);
    aoCriar();
  }

  if (!aberto) {
    return (
      <TouchableOpacity style={estilos.fab} onPress={abrir} accessibilityLabel="Novo lançamento">
        <Plus color="#fff" size={26} strokeWidth={2} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={estilos.painel}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Novo lançamento</Text>
        <TouchableOpacity onPress={() => setAberto(false)} accessibilityLabel="Fechar">
          <X color={tema.textSecondary} size={20} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      <View style={estilos.linha}>
        {(["despesa", "receita"] as const).map((opcao) => (
          <TouchableOpacity
            key={opcao}
            onPress={() => setTipo(opcao)}
            style={[estilos.chip, tipo === opcao && estilos.chipSelecionado]}
          >
            <Text style={tipo === opcao ? estilos.chipTextoSelecionado : estilos.chipTexto}>
              {opcao}
            </Text>
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
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setCategoriaId(item.id)}
            style={[estilos.chip, categoriaId === item.id && estilos.chipSelecionado]}
          >
            <Text style={categoriaId === item.id ? estilos.chipTextoSelecionado : estilos.chipTexto}>
              {item.nome}
            </Text>
          </TouchableOpacity>
        )}
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
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    fab: {
      position: "absolute",
      right: 20,
      bottom: 28,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: tema.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
    painel: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 20,
      gap: 8,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 14,
    },
    cabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    titulo: { fontSize: 14, fontWeight: "600", color: tema.foreground },
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
  });
}
