import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  criarFlashcard,
  listarFilaDoDia,
  listarTopicos,
  revisarFlashcard,
  type BotaoRevisao,
  type Flashcard,
  type Topico,
} from "../../lib/estudos";
import { useTema, raioCard, raioControle, type Tema } from "../../lib/theme";

const botoes: { botao: BotaoRevisao; rotulo: string }[] = [
  { botao: "de_novo", rotulo: "De novo" },
  { botao: "dificil", rotulo: "Difícil" },
  { botao: "bom", rotulo: "Bom" },
  { botao: "facil", rotulo: "Fácil" },
];

export function FlashcardsSecao({ versao, aoMudar }: { versao: number; aoMudar: () => void }) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  const [fila, setFila] = useState<Flashcard[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [revisados, setRevisados] = useState(0);

  const [novoCartao, setNovoCartao] = useState({ topicoId: null as string | null, frente: "", verso: "" });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarFilaDoDia().then(setFila);
    listarTopicos().then(setTopicos);
    setIndice(0);
    setRevisados(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);

  const cartaoAtual = fila[indice];

  async function avaliar(botao: BotaoRevisao) {
    if (!cartaoAtual) return;
    setEnviando(true);
    await revisarFlashcard(cartaoAtual.id, botao);
    setEnviando(false);
    setRevisados((n) => n + 1);
    setRevelado(false);
    setIndice((i) => i + 1);
  }

  async function adicionarFlashcard() {
    if (!novoCartao.topicoId || !novoCartao.frente.trim() || !novoCartao.verso.trim()) {
      setErro("Selecione o tópico e preencha frente e verso.");
      return;
    }
    setEnviando(true);
    const erroAcao = await criarFlashcard({
      topicoId: novoCartao.topicoId,
      frente: novoCartao.frente.trim(),
      verso: novoCartao.verso.trim(),
    });
    setEnviando(false);
    if (erroAcao) {
      setErro(erroAcao);
      return;
    }
    setNovoCartao({ topicoId: novoCartao.topicoId, frente: "", verso: "" });
    aoMudar();
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={estilos.card}>
        {!fila.length ? (
          <Text style={estilos.vazio}>Nenhum flashcard para revisar hoje.</Text>
        ) : !cartaoAtual ? (
          <Text style={{ color: tema.success, fontSize: 13 }}>
            Fila do dia concluída — {revisados} cartão(ões) revisado(s).
          </Text>
        ) : (
          <>
            <Text style={estilos.meta}>
              {cartaoAtual.topico?.titulo ?? "—"} · {fila.length - indice} restante(s)
            </Text>
            <Text style={estilos.frente}>{cartaoAtual.frente}</Text>
            {revelado ? (
              <>
                <Text style={estilos.verso}>{cartaoAtual.verso}</Text>
                <View style={estilos.botoesLinha}>
                  {botoes.map(({ botao, rotulo }) => (
                    <TouchableOpacity
                      key={botao}
                      disabled={enviando}
                      onPress={() => avaliar(botao)}
                      style={botao === "bom" ? estilos.botaoPrimario : estilos.botaoSecundario}
                    >
                      <Text style={botao === "bom" ? estilos.botaoPrimarioTexto : estilos.botaoSecundarioTexto}>
                        {rotulo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <TouchableOpacity onPress={() => setRevelado(true)} style={estilos.botaoSecundario}>
                <Text style={estilos.botaoSecundarioTexto}>Virar cartão</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <View style={estilos.card}>
        <View style={estilos.chipsLinha}>
          {topicos.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setNovoCartao((a) => ({ ...a, topicoId: t.id }))}
              style={[estilos.chip, novoCartao.topicoId === t.id && estilos.chipSelecionado]}
            >
              <Text style={novoCartao.topicoId === t.id ? estilos.chipTextoSelecionado : estilos.chipTexto}>
                {t.titulo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={novoCartao.frente}
          onChangeText={(t) => setNovoCartao((a) => ({ ...a, frente: t }))}
          placeholder="frente"
          placeholderTextColor={tema.textSecondary}
          multiline
          style={estilos.input}
        />
        <TextInput
          value={novoCartao.verso}
          onChangeText={(t) => setNovoCartao((a) => ({ ...a, verso: t }))}
          placeholder="verso"
          placeholderTextColor={tema.textSecondary}
          multiline
          style={estilos.input}
        />
        {erro && <Text style={estilos.erro}>{erro}</Text>}
        <TouchableOpacity onPress={adicionarFlashcard} disabled={enviando} style={estilos.botaoPrimario}>
          <Text style={estilos.botaoPrimarioTexto}>{enviando ? "Salvando..." : "Adicionar flashcard"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    card: {
      gap: 8,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 14,
    },
    meta: { fontSize: 11, color: tema.textSecondary, textAlign: "center" },
    frente: { fontSize: 15, color: tema.foreground, textAlign: "center" },
    verso: {
      fontSize: 13,
      color: tema.textSecondary,
      backgroundColor: tema.background,
      borderRadius: raioControle,
      padding: 10,
      textAlign: "center",
    },
    botoesLinha: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
    botaoPrimario: { backgroundColor: tema.primary, borderRadius: raioControle, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center" },
    botaoPrimarioTexto: { color: "#fff", fontSize: 13, fontWeight: "600" },
    botaoSecundario: {
      borderWidth: 1,
      borderColor: tema.border,
      borderRadius: raioControle,
      paddingVertical: 10,
      paddingHorizontal: 14,
      alignItems: "center",
    },
    botaoSecundarioTexto: { fontSize: 13, color: tema.foreground },
    vazio: { fontSize: 12, color: tema.textSecondary },
    erro: { fontSize: 12, color: tema.danger },
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
  });
}
