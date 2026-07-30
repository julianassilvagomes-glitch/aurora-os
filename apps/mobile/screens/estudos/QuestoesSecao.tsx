import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  criarQuestao,
  listarQuestoesDoTopico,
  listarTopicos,
  responderQuestao,
  type Questao,
  type Topico,
} from "../../lib/estudos";
import type { Database } from "@aurora/shared";
import { useTema, raioCard, raioControle, type Tema } from "../../lib/theme";

type MotivoErro = Database["public"]["Enums"]["motivo_erro_questao"];

const motivos: { valor: MotivoErro; rotulo: string }[] = [
  { valor: "desconhecimento", rotulo: "desconhecimento" },
  { valor: "pegadinha", rotulo: "pegadinha" },
  { valor: "interpretacao", rotulo: "interpretação" },
  { valor: "distracao", rotulo: "distração" },
];

export function QuestoesSecao() {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [topicoId, setTopicoId] = useState<string | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [motivo, setMotivo] = useState<MotivoErro | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [novaQuestao, setNovaQuestao] = useState({ enunciado: "", gabarito: "", banca: "" });

  useEffect(() => {
    listarTopicos().then(setTopicos);
  }, []);

  useEffect(() => {
    if (!topicoId) {
      setQuestoes([]);
      return;
    }
    setIndice(0);
    setRevelado(false);
    listarQuestoesDoTopico(topicoId).then(setQuestoes);
  }, [topicoId]);

  const pendentes = questoes.filter((q) => !q.respondida);
  const questaoAtual = pendentes[indice];

  async function responder(acertou: boolean) {
    if (!questaoAtual) return;
    if (!acertou && !motivo) {
      setErro("Selecione o motivo do erro.");
      return;
    }
    setEnviando(true);
    const erroAcao = await responderQuestao(questaoAtual.id, acertou, acertou ? null : motivo);
    setEnviando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setErro(null);
    setRevelado(false);
    setMotivo(null);
    setIndice((i) => i + 1);
  }

  async function adicionarQuestao() {
    if (!topicoId || !novaQuestao.enunciado.trim() || !novaQuestao.gabarito.trim()) {
      setErro("Selecione o tópico e preencha enunciado e gabarito.");
      return;
    }
    setEnviando(true);
    const erroAcao = await criarQuestao({
      topicoId,
      enunciado: novaQuestao.enunciado.trim(),
      gabarito: novaQuestao.gabarito.trim(),
      banca: novaQuestao.banca.trim() || null,
      ano: null,
    });
    setEnviando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setNovaQuestao({ enunciado: "", gabarito: "", banca: "" });
    setQuestoes(await listarQuestoesDoTopico(topicoId));
  }

  return (
    <View style={{ gap: 8 }}>
      <FlatList
        horizontal
        data={topicos}
        keyExtractor={(t) => t.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setTopicoId(item.id)}
            style={[estilos.chip, topicoId === item.id && estilos.chipSelecionado]}
          >
            <Text style={topicoId === item.id ? estilos.chipTextoSelecionado : estilos.chipTexto}>
              {item.titulo}
            </Text>
          </TouchableOpacity>
        )}
      />

      {topicoId && (
        <View style={estilos.card}>
          {questaoAtual ? (
            <>
              <Text style={estilos.meta}>{pendentes.length - indice} pendente(s)</Text>
              <Text style={estilos.enunciado}>{questaoAtual.enunciado}</Text>
              {revelado ? (
                <>
                  <Text style={estilos.gabarito}>
                    <Text style={{ fontWeight: "600", color: tema.foreground }}>Gabarito: </Text>
                    {questaoAtual.gabarito}
                  </Text>
                  <View style={estilos.respostaLinha}>
                    <TouchableOpacity
                      onPress={() => responder(true)}
                      disabled={enviando}
                      style={estilos.botaoPrimario}
                    >
                      <Text style={estilos.botaoPrimarioTexto}>Acertei</Text>
                    </TouchableOpacity>
                    <View style={estilos.motivosLinha}>
                      {motivos.map((m) => (
                        <TouchableOpacity
                          key={m.valor}
                          onPress={() => setMotivo(m.valor)}
                          style={[estilos.chip, motivo === m.valor && estilos.chipSelecionado]}
                        >
                          <Text style={motivo === m.valor ? estilos.chipTextoSelecionado : estilos.chipTexto}>
                            {m.rotulo}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      onPress={() => responder(false)}
                      disabled={enviando}
                      style={estilos.botaoSecundario}
                    >
                      <Text style={{ color: tema.danger, fontSize: 13 }}>Errei</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity onPress={() => setRevelado(true)} style={estilos.botaoSecundario}>
                  <Text style={{ color: tema.primary, fontSize: 13 }}>Revelar gabarito</Text>
                </TouchableOpacity>
              )}
              {erro && <Text style={estilos.erro}>{erro}</Text>}
            </>
          ) : (
            <Text style={estilos.vazio}>
              {questoes.length ? "Todas as questões deste tópico já foram respondidas." : "Nenhuma questão cadastrada ainda."}
            </Text>
          )}
        </View>
      )}

      <View style={estilos.card}>
        <TextInput
          value={novaQuestao.enunciado}
          onChangeText={(t) => setNovaQuestao((a) => ({ ...a, enunciado: t }))}
          placeholder="enunciado"
          placeholderTextColor={tema.textSecondary}
          multiline
          style={estilos.input}
        />
        <TextInput
          value={novaQuestao.gabarito}
          onChangeText={(t) => setNovaQuestao((a) => ({ ...a, gabarito: t }))}
          placeholder="gabarito"
          placeholderTextColor={tema.textSecondary}
          multiline
          style={estilos.input}
        />
        <TextInput
          value={novaQuestao.banca}
          onChangeText={(t) => setNovaQuestao((a) => ({ ...a, banca: t }))}
          placeholder="banca (opcional)"
          placeholderTextColor={tema.textSecondary}
          style={estilos.input}
        />
        <TouchableOpacity onPress={adicionarQuestao} disabled={enviando} style={estilos.botaoPrimario}>
          <Text style={estilos.botaoPrimarioTexto}>{enviando ? "Salvando..." : "Adicionar questão"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    chip: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioControle,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginRight: 6,
      marginBottom: 6,
    },
    chipSelecionado: { backgroundColor: tema.primary, borderColor: tema.primary },
    chipTexto: { fontSize: 12, color: tema.foreground },
    chipTextoSelecionado: { fontSize: 12, color: "#fff", fontWeight: "600" },
    card: {
      gap: 8,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 12,
    },
    meta: { fontSize: 11, color: tema.textSecondary },
    enunciado: { fontSize: 13, color: tema.foreground },
    gabarito: { fontSize: 13, color: tema.textSecondary, backgroundColor: tema.background, borderRadius: raioControle, padding: 8 },
    respostaLinha: { gap: 8 },
    motivosLinha: { flexDirection: "row", flexWrap: "wrap" },
    botaoPrimario: { backgroundColor: tema.primary, borderRadius: raioControle, paddingVertical: 10, alignItems: "center" },
    botaoPrimarioTexto: { color: "#fff", fontSize: 13, fontWeight: "600" },
    botaoSecundario: {
      borderWidth: 1,
      borderColor: tema.border,
      borderRadius: raioControle,
      paddingVertical: 8,
      alignItems: "center",
    },
    erro: { fontSize: 12, color: tema.danger },
    vazio: { fontSize: 12, color: tema.textSecondary },
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
  });
}
