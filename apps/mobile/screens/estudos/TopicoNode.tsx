import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChevronRight, ChevronDown, Plus } from "lucide-react-native";
import { atualizarStatusTopico, criarTopico, type Topico } from "../../lib/estudos";
import { useTema, raioControle, type Tema } from "../../lib/theme";

const opcoesStatus: { valor: Topico["status"]; rotulo: string }[] = [
  { valor: "nao_iniciado", rotulo: "não iniciado" },
  { valor: "em_estudo", rotulo: "em estudo" },
  { valor: "revisado", rotulo: "revisado" },
  { valor: "consolidado", rotulo: "consolidado" },
];

export function TopicoNode({
  topico,
  todos,
  disciplinaId,
  aoMudar,
}: {
  topico: Topico;
  todos: Topico[];
  disciplinaId: string;
  aoMudar: () => void;
}) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);
  const filhos = todos.filter((t) => t.topico_pai_id === topico.id);

  const [aberto, setAberto] = useState(false);
  const [mostrarNovoSub, setMostrarNovoSub] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function mudarStatus(novoStatus: Topico["status"]) {
    setSalvando(true);
    setErro(null);
    const erroAcao = await atualizarStatusTopico(topico.id, novoStatus);
    setSalvando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    aoMudar();
  }

  async function adicionarSubtopico() {
    if (!novoTitulo.trim()) return;
    setSalvando(true);
    const erroAcao = await criarTopico(disciplinaId, novoTitulo.trim(), topico.id, null);
    setSalvando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setNovoTitulo("");
    setMostrarNovoSub(false);
    aoMudar();
  }

  return (
    <View>
      <View style={estilos.linha}>
        <TouchableOpacity onPress={() => setAberto((v) => !v)} disabled={filhos.length === 0}>
          {filhos.length > 0 ? (
            aberto ? (
              <ChevronDown color={tema.textSecondary} size={16} strokeWidth={1.75} />
            ) : (
              <ChevronRight color={tema.textSecondary} size={16} strokeWidth={1.75} />
            )
          ) : (
            <View style={{ width: 16 }} />
          )}
        </TouchableOpacity>
        <Text style={estilos.titulo}>{topico.titulo}</Text>
        <TouchableOpacity onPress={() => setMostrarNovoSub((v) => !v)}>
          <Plus color={tema.textSecondary} size={16} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      <View style={estilos.statusLinha}>
        {opcoesStatus.map((opcao) => {
          const bloqueado = opcao.valor === "consolidado" && topico.contador_revisoes < 3;
          const selecionado = topico.status === opcao.valor;
          return (
            <TouchableOpacity
              key={opcao.valor}
              disabled={salvando || bloqueado}
              onPress={() => mudarStatus(opcao.valor)}
              style={[
                estilos.statusChip,
                selecionado && estilos.statusChipSelecionado,
                bloqueado && { opacity: 0.4 },
              ]}
            >
              <Text style={selecionado ? estilos.statusTextoSelecionado : estilos.statusTexto}>
                {opcao.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {erro && <Text style={estilos.erro}>{erro}</Text>}

      {mostrarNovoSub && (
        <View style={estilos.novoSubLinha}>
          <TextInput
            value={novoTitulo}
            onChangeText={setNovoTitulo}
            placeholder="novo subtópico"
            placeholderTextColor={tema.textSecondary}
            style={estilos.input}
          />
          <TouchableOpacity onPress={adicionarSubtopico} disabled={salvando}>
            <Text style={estilos.adicionarTexto}>{salvando ? "..." : "Adicionar"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {aberto && filhos.length > 0 && (
        <View style={estilos.filhos}>
          {filhos.map((filho) => (
            <TopicoNode
              key={filho.id}
              topico={filho}
              todos={todos}
              disciplinaId={disciplinaId}
              aoMudar={aoMudar}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    linha: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
    titulo: { flex: 1, fontSize: 13, color: tema.foreground },
    statusLinha: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginLeft: 22, marginBottom: 4 },
    statusChip: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioControle,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusChipSelecionado: { backgroundColor: tema.primary, borderColor: tema.primary },
    statusTexto: { fontSize: 10, color: tema.foreground },
    statusTextoSelecionado: { fontSize: 10, color: "#fff", fontWeight: "600" },
    erro: { fontSize: 11, color: tema.danger, marginLeft: 22 },
    novoSubLinha: { flexDirection: "row", gap: 6, marginLeft: 22, marginBottom: 4, alignItems: "center" },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.background,
      color: tema.foreground,
      borderRadius: raioControle,
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
    },
    adicionarTexto: { fontSize: 12, color: tema.primary, fontWeight: "600" },
    filhos: { marginLeft: 22, borderLeftWidth: 1, borderLeftColor: tema.border, paddingLeft: 8 },
  });
}
