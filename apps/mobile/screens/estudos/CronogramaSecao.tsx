import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  criarBlocoCronograma,
  diasDaSemanaAtual,
  listarBlocosSemana,
  listarDisciplinas,
  listarTopicos,
  marcarBlocoStatus,
  realocarBloco,
  sugerirProximaDisciplina,
  type BlocoCronograma,
  type Disciplina,
  type Topico,
} from "../../lib/estudos";
import { coresCategoria, rotuloCategoria } from "../../lib/categoria-cores";
import { useTema, raioCard, raioControle, type Tema } from "../../lib/theme";

const categorias = [
  { valor: "lei_seca", rotulo: "lei seca" },
  { valor: "doutrina", rotulo: "doutrina" },
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

const nomesDias = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function formatarDataCurta(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

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

  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);
  const dias = useMemo(() => diasDaSemanaAtual(hoje), [versao]);

  async function recarregar() {
    const [d, t, b, sugestao] = await Promise.all([
      listarDisciplinas(),
      listarTopicos(),
      listarBlocosSemana(dias[0], dias[dias.length - 1]),
      listarDisciplinas().then((lista) => sugerirProximaDisciplina(lista)),
    ]);
    setDisciplinas(d);
    setTopicos(t);
    setBlocos(b);
    setDisciplinaId((atual) => atual ?? sugestao);
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
      data: hojeStr,
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {dias.map((dia, indice) => {
            const ehHoje = dia === hojeStr;
            const blocosDoDia = blocos.filter((b) => b.data === dia);
            const porCategoria = new Map<string, BlocoCronograma[]>();
            for (const bloco of blocosDoDia) {
              const lista = porCategoria.get(bloco.categoria) ?? [];
              lista.push(bloco);
              porCategoria.set(bloco.categoria, lista);
            }

            return (
              <View key={dia} style={[estilos.diaCard, ehHoje && estilos.diaCardHoje]}>
                <Text style={[estilos.diaTitulo, ehHoje && { color: tema.primaryDark }]}>
                  {nomesDias[indice]} <Text style={estilos.diaData}>{formatarDataCurta(dia)}</Text>
                </Text>
                {blocosDoDia.length === 0 ? (
                  <Text style={estilos.vazioDia}>nada planejado</Text>
                ) : (
                  [...porCategoria.entries()].map(([cat, itens]) => {
                    const cores = coresCategoria(tema, cat);
                    return (
                      <View key={cat} style={[estilos.grupoCategoria, { backgroundColor: cores.bg }]}>
                        <Text style={[estilos.grupoTitulo, { color: cores.text }]}>
                          {rotuloCategoria[cat] ?? cat}
                        </Text>
                        {itens.map((bloco) => (
                          <View key={bloco.id} style={estilos.blocoItem}>
                            <Text style={[estilos.blocoTitulo, { color: cores.text }]}>
                              {bloco.disciplina?.nome ?? "—"}
                            </Text>
                            <Text style={estilos.blocoMeta}>
                              {bloco.duracao_planejada_min} min ·{" "}
                              {rotuloStatus[bloco.status] ?? bloco.status}
                            </Text>
                            {bloco.status === "planejado" && (
                              <View style={estilos.acoes}>
                                <TouchableOpacity onPress={() => concluir(bloco.id)}>
                                  <Text style={{ color: tema.success, fontSize: 10 }}>concluir</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => marcarPerdido(bloco.id)}>
                                  <Text style={{ color: tema.textSecondary, fontSize: 10 }}>
                                    perdido
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                            {bloco.status === "perdido" && (
                              <TouchableOpacity onPress={() => setRealocandoId(bloco.id)}>
                                <Text style={{ color: tema.primary, fontSize: 10 }}>realocar</Text>
                              </TouchableOpacity>
                            )}
                            {realocandoId === bloco.id && (
                              <View style={estilos.realocarLinha}>
                                <TextInput
                                  value={novaDataRealoc}
                                  onChangeText={setNovaDataRealoc}
                                  placeholder="AAAA-MM-DD"
                                  placeholderTextColor={tema.textSecondary}
                                  style={estilos.inputRealocar}
                                />
                                <TouchableOpacity onPress={() => confirmarRealocacao(bloco.id)}>
                                  <Text style={estilos.adicionarTexto}>OK</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
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
    diaCard: {
      width: 150,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 8,
      gap: 6,
    },
    diaCardHoje: { borderColor: tema.primary, backgroundColor: tema.surfacePrimary },
    diaTitulo: { fontSize: 12, fontWeight: "600", color: tema.textSecondary },
    diaData: { fontWeight: "400" },
    vazioDia: { fontSize: 11, color: tema.textSecondary },
    grupoCategoria: { borderRadius: raioControle, padding: 6, gap: 4 },
    grupoTitulo: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
    blocoItem: { gap: 2 },
    blocoTitulo: { fontSize: 11, fontWeight: "600" },
    blocoMeta: { fontSize: 10, color: tema.textSecondary },
    acoes: { flexDirection: "row", gap: 8 },
    realocarLinha: { flexDirection: "row", gap: 4, alignItems: "center", marginTop: 2 },
    inputRealocar: {
      flex: 1,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.background,
      color: tema.foreground,
      borderRadius: raioControle,
      paddingHorizontal: 6,
      paddingVertical: 4,
      fontSize: 10,
    },
    adicionarTexto: { fontSize: 11, color: tema.primary, fontWeight: "600" },
  });
}
