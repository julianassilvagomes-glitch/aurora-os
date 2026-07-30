import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  criarDisciplina,
  criarTopico,
  listarDisciplinas,
  listarTopicos,
  type Disciplina,
  type Topico,
} from "../../lib/estudos";
import { TopicoNode } from "./TopicoNode";
import { useTema, raioCard, raioControle, type Tema } from "../../lib/theme";

export function EditalTree({ versao, aoMudar }: { versao: number; aoMudar: () => void }) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);

  const [novoTituloPorDisciplina, setNovoTituloPorDisciplina] = useState<Record<string, string>>({});
  const [novaDisciplina, setNovaDisciplina] = useState({ nome: "", area: "", ordem: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function recarregar() {
    setDisciplinas(await listarDisciplinas());
    setTopicos(await listarTopicos());
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);

  async function adicionarTopicoRaiz(disciplinaId: string) {
    const titulo = novoTituloPorDisciplina[disciplinaId]?.trim();
    if (!titulo) return;
    setSalvando(true);
    const erroAcao = await criarTopico(disciplinaId, titulo, null, null);
    setSalvando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setNovoTituloPorDisciplina((atual) => ({ ...atual, [disciplinaId]: "" }));
    await recarregar();
    aoMudar();
  }

  async function adicionarDisciplina() {
    const ordem = Number(novaDisciplina.ordem);
    if (!novaDisciplina.nome.trim() || !novaDisciplina.area.trim() || !Number.isFinite(ordem)) {
      setErro("Preencha nome, área e ordem no ciclo.");
      return;
    }
    setSalvando(true);
    const erroAcao = await criarDisciplina(novaDisciplina.nome.trim(), novaDisciplina.area.trim(), ordem);
    setSalvando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setNovaDisciplina({ nome: "", area: "", ordem: "" });
    await recarregar();
    aoMudar();
  }

  return (
    <View style={{ gap: 8 }}>
      {disciplinas.length ? (
        disciplinas.map((disciplina) => {
          const topicosDaDisciplina = topicos.filter((t) => t.disciplina_id === disciplina.id);
          const raizes = topicosDaDisciplina.filter((t) => t.topico_pai_id === null);
          return (
            <View key={disciplina.id} style={estilos.disciplinaCard}>
              <View style={estilos.disciplinaCabecalho}>
                <Text style={estilos.disciplinaNome}>{disciplina.nome}</Text>
                <Text style={estilos.disciplinaArea}>{disciplina.area}</Text>
              </View>
              {raizes.map((topico) => (
                <TopicoNode
                  key={topico.id}
                  topico={topico}
                  todos={topicosDaDisciplina}
                  disciplinaId={disciplina.id}
                  aoMudar={async () => {
                    await recarregar();
                    aoMudar();
                  }}
                />
              ))}
              <View style={estilos.novoTopicoLinha}>
                <TextInput
                  value={novoTituloPorDisciplina[disciplina.id] ?? ""}
                  onChangeText={(texto) =>
                    setNovoTituloPorDisciplina((atual) => ({ ...atual, [disciplina.id]: texto }))
                  }
                  placeholder="novo tópico"
                  placeholderTextColor={tema.textSecondary}
                  style={estilos.input}
                />
                <TouchableOpacity onPress={() => adicionarTopicoRaiz(disciplina.id)} disabled={salvando}>
                  <Text style={estilos.adicionarTexto}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={estilos.vazio}>Nenhuma disciplina cadastrada ainda.</Text>
      )}

      {erro && <Text style={estilos.erro}>{erro}</Text>}

      <View style={estilos.novaDisciplinaCard}>
        <TextInput
          value={novaDisciplina.nome}
          onChangeText={(texto) => setNovaDisciplina((atual) => ({ ...atual, nome: texto }))}
          placeholder="nova disciplina"
          placeholderTextColor={tema.textSecondary}
          style={estilos.input}
        />
        <TextInput
          value={novaDisciplina.area}
          onChangeText={(texto) => setNovaDisciplina((atual) => ({ ...atual, area: texto }))}
          placeholder="área"
          placeholderTextColor={tema.textSecondary}
          style={estilos.input}
        />
        <TextInput
          value={novaDisciplina.ordem}
          onChangeText={(texto) => setNovaDisciplina((atual) => ({ ...atual, ordem: texto }))}
          placeholder="ordem no ciclo"
          placeholderTextColor={tema.textSecondary}
          keyboardType="number-pad"
          style={estilos.input}
        />
        <TouchableOpacity onPress={adicionarDisciplina} disabled={salvando} style={estilos.botao}>
          <Text style={estilos.botaoTexto}>{salvando ? "Salvando..." : "Adicionar disciplina"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    disciplinaCard: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 12,
      gap: 4,
    },
    disciplinaCabecalho: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    disciplinaNome: { fontSize: 14, fontWeight: "600", color: tema.foreground },
    disciplinaArea: { fontSize: 11, color: tema.textSecondary },
    novoTopicoLinha: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 4 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.background,
      color: tema.foreground,
      borderRadius: raioControle,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 12,
    },
    adicionarTexto: { fontSize: 12, color: tema.primary, fontWeight: "600" },
    vazio: { fontSize: 12, color: tema.textSecondary },
    erro: { fontSize: 12, color: tema.danger },
    novaDisciplinaCard: {
      gap: 6,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 12,
    },
    botao: {
      borderWidth: 1,
      borderColor: tema.border,
      borderRadius: raioControle,
      paddingVertical: 8,
      alignItems: "center",
    },
    botaoTexto: { fontSize: 12, color: tema.primary, fontWeight: "600" },
  });
}
