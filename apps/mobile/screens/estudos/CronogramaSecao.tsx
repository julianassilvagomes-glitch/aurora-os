import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  criarBlocoCronograma,
  listarBlocosCronograma,
  listarDisciplinas,
  listarTopicos,
  marcarBlocoStatus,
  realocarBloco,
  sugerirProximaDisciplina,
  type BlocoCronograma,
  type Disciplina,
  type Topico,
} from "../../lib/estudos";
import { useTema, raioCard, raioControle, type Tema } from "../../lib/theme";

const categorias = [
  { valor: "lei_seca", rotulo: "lei seca" },
  { valor: "jurisprudencia", rotulo: "jurisprudência" },
  { valor: "questoes", rotulo: "questões" },
  { valor: "revisao", rotulo: "revisão" },
  { valor: "redacao", rotulo: "redação" },
] as const;

const rotuloStatus: Record<string, string> = {
  planejado: "planejado",
  realocado: "realocado",
  concluido: "concluído",
  perdido: "perdido",
};

export function CronogramaSecao({ versao, aoMudar }: { versao: number; aoMudar: () => void }) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [blocos, setBlocos] = useState<BlocoCronograma[]>([]);

  const [disciplinaId, setDisciplinaId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<(typeof categorias)[number]["valor"] | null>(null);
  const [duracao, setDuracao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [realocandoId, setRealocandoId] = useState<string | null>(null);
  const [novaDataRealoc, setNovaDataRealoc] = useState("");

  async function recarregar() {
    const [d, t, b] = await Promise.all([listarDisciplinas(), listarTopicos(), listarBlocosCronograma()]);
    setDisciplinas(d);
    setTopicos(t);
    setBlocos(b);
    setDisciplinaId((atual) => atual ?? sugerirProximaDisciplina(d, b));
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);

  async function adicionar() {
    const duracaoNumerica = Number(duracao);
    if (!disciplinaId || !categoria || !Number.isFinite(duracaoNumerica) || duracaoNumerica <= 0) {
      setErro("Preencha disciplina, categoria e duração.");
      return;
    }
    setSalvando(true);
    const erroAcao = await criarBlocoCronograma({
      data: new Date().toISOString().slice(0, 10),
      disciplinaId,
      topicoId: null,
      categoria,
      duracaoPlanejadaMin: duracaoNumerica,
    });
    setSalvando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setDuracao("");
    setCategoria(null);
    await recarregar();
    aoMudar();
  }

  async function concluir(id: string) {
    await marcarBlocoStatus(id, "concluido");
    await recarregar();
    aoMudar();
  }

  async function marcarPerdido(id: string) {
    await marcarBlocoStatus(id, "perdido");
    await recarregar();
    aoMudar();
  }

  async function confirmarRealocacao(id: string) {
    if (!novaDataRealoc) return;
    const erroAcao = await realocarBloco(id, novaDataRealoc, null);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setRealocandoId(null);
    setNovaDataRealoc("");
    await recarregar();
    aoMudar();
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={estilos.formCard}>
        {disciplinaId && (
          <Text style={estilos.sugestao}>
            Sugestão do ciclo: {disciplinas.find((d) => d.id === disciplinaId)?.nome}
          </Text>
        )}
        <View style={estilos.chipsLinha}>
          {disciplinas.map((d) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => setDisciplinaId(d.id)}
              style={[estilos.chip, disciplinaId === d.id && estilos.chipSelecionado]}
            >
              <Text style={disciplinaId === d.id ? estilos.chipTextoSelecionado : estilos.chipTexto}>
                {d.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={estilos.chipsLinha}>
          {categorias.map((c) => (
            <TouchableOpacity
              key={c.valor}
              onPress={() => setCategoria(c.valor)}
              style={[estilos.chip, categoria === c.valor && estilos.chipSelecionado]}
            >
              <Text style={categoria === c.valor ? estilos.chipTextoSelecionado : estilos.chipTexto}>
                {c.rotulo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={duracao}
          onChangeText={setDuracao}
          placeholder="minutos"
          placeholderTextColor={tema.textSecondary}
          keyboardType="number-pad"
          style={estilos.input}
        />
        {erro && <Text style={estilos.erro}>{erro}</Text>}
        <TouchableOpacity onPress={adicionar} disabled={salvando} style={estilos.botao}>
          <Text style={estilos.botaoTexto}>{salvando ? "Salvando..." : "Adicionar bloco"}</Text>
        </TouchableOpacity>
      </View>

      {blocos.length ? (
        blocos.map((bloco) => (
          <View key={bloco.id} style={estilos.blocoCard}>
            <View style={estilos.blocoLinha}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.blocoTitulo}>
                  {bloco.disciplina?.nome ?? "—"}
                  {bloco.topico ? ` · ${bloco.topico.titulo}` : ""}
                </Text>
                <Text style={estilos.blocoMeta}>
                  {bloco.data} · {categorias.find((c) => c.valor === bloco.categoria)?.rotulo} ·{" "}
                  {bloco.duracao_planejada_min} min · {rotuloStatus[bloco.status] ?? bloco.status}
                </Text>
              </View>
              {bloco.status === "planejado" && (
                <View style={estilos.acoes}>
                  <TouchableOpacity onPress={() => concluir(bloco.id)}>
                    <Text style={{ color: tema.success, fontSize: 11 }}>concluir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => marcarPerdido(bloco.id)}>
                    <Text style={{ color: tema.textSecondary, fontSize: 11 }}>perdido</Text>
                  </TouchableOpacity>
                </View>
              )}
              {bloco.status === "perdido" && (
                <TouchableOpacity onPress={() => setRealocandoId(bloco.id)}>
                  <Text style={{ color: tema.primary, fontSize: 11 }}>realocar</Text>
                </TouchableOpacity>
              )}
            </View>
            {realocandoId === bloco.id && (
              <View style={estilos.realocarLinha}>
                <TextInput
                  value={novaDataRealoc}
                  onChangeText={setNovaDataRealoc}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={tema.textSecondary}
                  style={estilos.input}
                />
                <TouchableOpacity onPress={() => confirmarRealocacao(bloco.id)}>
                  <Text style={estilos.adicionarTexto}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={estilos.vazio}>Nenhum bloco no cronograma ainda.</Text>
      )}
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    formCard: {
      gap: 8,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 12,
    },
    sugestao: { fontSize: 11, color: tema.textSecondary },
    chipsLinha: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.background,
      borderRadius: raioControle,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    chipSelecionado: { backgroundColor: tema.primary, borderColor: tema.primary },
    chipTexto: { fontSize: 12, color: tema.foreground },
    chipTextoSelecionado: { fontSize: 12, color: "#fff", fontWeight: "600" },
    input: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.background,
      color: tema.foreground,
      borderRadius: raioControle,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
    },
    erro: { fontSize: 12, color: tema.danger },
    botao: { backgroundColor: tema.primary, borderRadius: raioControle, paddingVertical: 10, alignItems: "center" },
    botaoTexto: { color: "#fff", fontSize: 13, fontWeight: "600" },
    blocoCard: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 10,
      gap: 6,
    },
    blocoLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
    blocoTitulo: { fontSize: 13, color: tema.foreground },
    blocoMeta: { fontSize: 11, color: tema.textSecondary, marginTop: 2 },
    acoes: { flexDirection: "row", gap: 10 },
    realocarLinha: { flexDirection: "row", gap: 6, alignItems: "center" },
    adicionarTexto: { fontSize: 12, color: tema.primary, fontWeight: "600" },
    vazio: { fontSize: 12, color: tema.textSecondary },
  });
}
