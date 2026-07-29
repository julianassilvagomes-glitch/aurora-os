import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Pencil, Trash2, Lock, RotateCcw } from "lucide-react-native";
import {
  criarCategoria,
  editarCategoria,
  listarCategoriasGerenciaveis,
  reativarCategoria,
  removerOuDesativarCategoria,
  type CategoriaGerenciavel,
} from "../../lib/categorias";
import { useTema, raioControle, raioCard, type Tema } from "../../lib/theme";

const grupos = ["fixo", "variavel", "estudo", "trabalho", "pessoal"] as const;

export function CategoriaSection({
  versao,
  aoMudar,
}: {
  versao: number;
  aoMudar: () => void;
}) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  const [categorias, setCategorias] = useState<CategoriaGerenciavel[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [grupoEdicao, setGrupoEdicao] = useState<string>("variavel");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [novoNome, setNovoNome] = useState("");
  const [novoGrupo, setNovoGrupo] = useState<string>("variavel");

  async function recarregar() {
    setCategorias(await listarCategoriasGerenciaveis());
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);

  function iniciarEdicao(categoria: CategoriaGerenciavel) {
    setEditandoId(categoria.id);
    setNomeEdicao(categoria.nome);
    setGrupoEdicao(categoria.grupo);
    setErro(null);
  }

  async function salvarEdicao() {
    if (!editandoId || !nomeEdicao.trim()) return;
    setProcessando(true);
    const erroSalvar = await editarCategoria(editandoId, nomeEdicao.trim(), grupoEdicao);
    setProcessando(false);
    if (erroSalvar) {
      setErro(erroSalvar);
      return;
    }
    setEditandoId(null);
    await recarregar();
    aoMudar();
  }

  async function excluirOuDesativar(categoria: CategoriaGerenciavel) {
    setProcessando(true);
    const erroAcao = await removerOuDesativarCategoria(categoria.id);
    setProcessando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    await recarregar();
    aoMudar();
  }

  async function reativar(categoria: CategoriaGerenciavel) {
    setProcessando(true);
    const erroAcao = await reativarCategoria(categoria.id);
    setProcessando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    await recarregar();
    aoMudar();
  }

  async function adicionar() {
    if (!novoNome.trim()) return;
    setProcessando(true);
    const erroAcao = await criarCategoria(novoNome.trim(), novoGrupo);
    setProcessando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setNovoNome("");
    await recarregar();
    aoMudar();
  }

  return (
    <View style={estilos.container}>
      {categorias.map((categoria) =>
        editandoId === categoria.id ? (
          <View key={categoria.id} style={estilos.linhaEdicao}>
            <TextInput
              value={nomeEdicao}
              onChangeText={setNomeEdicao}
              style={estilos.inputEdicao}
              placeholderTextColor={tema.textSecondary}
            />
            <View style={estilos.gruposLinha}>
              {grupos.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGrupoEdicao(g)}
                  style={[estilos.grupoChip, grupoEdicao === g && estilos.grupoChipAtivo]}
                >
                  <Text
                    style={
                      grupoEdicao === g ? estilos.grupoChipTextoAtivo : estilos.grupoChipTexto
                    }
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={estilos.botoesEdicao}>
              <TouchableOpacity onPress={salvarEdicao} disabled={processando} style={estilos.salvarBotao}>
                <Text style={estilos.salvarTexto}>{processando ? "Salvando..." : "Salvar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditandoId(null)}>
                <Text style={estilos.cancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View key={categoria.id} style={estilos.linha}>
            <Text
              style={[
                estilos.nomeCategoria,
                !categoria.ativa && { color: tema.textSecondary },
              ]}
            >
              {categoria.nome}
              {!categoria.ativa ? " (desativada)" : ""}
            </Text>
            <View style={estilos.acoes}>
              <TouchableOpacity onPress={() => iniciarEdicao(categoria)}>
                <Pencil color={tema.textSecondary} size={16} strokeWidth={1.75} />
              </TouchableOpacity>
              {categoria.ativa ? (
                <TouchableOpacity
                  onPress={() => excluirOuDesativar(categoria)}
                  disabled={processando}
                >
                  {categoria.temLancamentos ? (
                    <Lock color={tema.textSecondary} size={16} strokeWidth={1.75} />
                  ) : (
                    <Trash2 color={tema.textSecondary} size={16} strokeWidth={1.75} />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => reativar(categoria)} disabled={processando}>
                  <RotateCcw color={tema.textSecondary} size={16} strokeWidth={1.75} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )
      )}

      {erro && <Text style={estilos.erro}>{erro}</Text>}

      <View style={estilos.novaLinha}>
        <TextInput
          value={novoNome}
          onChangeText={setNovoNome}
          placeholder="nova categoria"
          placeholderTextColor={tema.textSecondary}
          style={estilos.inputNova}
        />
        <View style={estilos.gruposLinha}>
          {grupos.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setNovoGrupo(g)}
              style={[estilos.grupoChip, novoGrupo === g && estilos.grupoChipAtivo]}
            >
              <Text style={novoGrupo === g ? estilos.grupoChipTextoAtivo : estilos.grupoChipTexto}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={adicionar} disabled={processando} style={estilos.adicionarBotao}>
          {processando ? (
            <ActivityIndicator size="small" color={tema.primary} />
          ) : (
            <Text style={estilos.adicionarTexto}>Adicionar categoria</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    container: {
      gap: 6,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 12,
    },
    linha: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    nomeCategoria: { fontSize: 13, color: tema.foreground },
    acoes: { flexDirection: "row", gap: 12 },
    linhaEdicao: {
      gap: 6,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.background,
      borderRadius: raioControle,
      padding: 8,
    },
    inputEdicao: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      color: tema.foreground,
      borderRadius: raioControle,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 13,
    },
    gruposLinha: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    grupoChip: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioControle,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    grupoChipAtivo: { backgroundColor: tema.primary, borderColor: tema.primary },
    grupoChipTexto: { fontSize: 11, color: tema.foreground },
    grupoChipTextoAtivo: { fontSize: 11, color: "#fff", fontWeight: "600" },
    botoesEdicao: { flexDirection: "row", gap: 12, alignItems: "center" },
    salvarBotao: {
      backgroundColor: tema.primary,
      borderRadius: raioControle,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    salvarTexto: { color: "#fff", fontSize: 12, fontWeight: "600" },
    cancelarTexto: { color: tema.textSecondary, fontSize: 12 },
    erro: { color: tema.danger, fontSize: 12 },
    novaLinha: { gap: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: tema.border, paddingTop: 8 },
    inputNova: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.background,
      color: tema.foreground,
      borderRadius: raioControle,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 13,
    },
    adicionarBotao: {
      borderWidth: 1,
      borderColor: tema.border,
      borderRadius: raioControle,
      paddingVertical: 8,
      alignItems: "center",
    },
    adicionarTexto: { color: tema.primary, fontSize: 12, fontWeight: "600" },
  });
}
