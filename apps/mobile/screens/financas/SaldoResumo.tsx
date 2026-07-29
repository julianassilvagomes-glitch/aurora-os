import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import { saldoEmCache, type Saldo } from "../../lib/saldo";
import { useTema, raioCard, type Tema } from "../../lib/theme";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function SaldoResumo({ versao }: { versao: number }) {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);
  const [saldo, setSaldo] = useState<Saldo | null>(null);

  useEffect(() => {
    saldoEmCache().then(setSaldo);
  }, [versao]);

  if (!saldo) return null;

  return (
    <View style={{ gap: 8 }}>
      <View style={estilos.saldoCard}>
        <Text style={estilos.saldoLabel}>Saldo atual</Text>
        <Text style={estilos.saldoValor}>{formatarMoeda(saldo.saldoAtual)}</Text>
      </View>

      {/* Exceção deliberada ao "nenhuma cor decorativa": só receita/despesa. */}
      <View style={estilos.linhaReceitaDespesa}>
        <View style={[estilos.bloco, { backgroundColor: tema.receitaBg }]}>
          <ArrowUpRight color={tema.receitaText} size={18} strokeWidth={1.75} />
          <View>
            <Text style={[estilos.blocoLabel, { color: tema.receitaText }]}>Receitas</Text>
            <Text style={[estilos.blocoValor, { color: tema.receitaText }]}>
              {formatarMoeda(saldo.totalReceitas)}
            </Text>
          </View>
        </View>
        <View style={[estilos.bloco, { backgroundColor: tema.despesaBg }]}>
          <ArrowDownRight color={tema.despesaText} size={18} strokeWidth={1.75} />
          <View>
            <Text style={[estilos.blocoLabel, { color: tema.despesaText }]}>Despesas</Text>
            <Text style={[estilos.blocoValor, { color: tema.despesaText }]}>
              {formatarMoeda(saldo.totalDespesas)}
            </Text>
          </View>
        </View>
      </View>

      <View style={estilos.runwayCard}>
        <Text style={estilos.runwayLabel}>Runway (média de despesas, 3 meses)</Text>
        <Text style={estilos.runwayValor}>
          {saldo.mesesRestantes === null
            ? "sem despesas registradas"
            : `${saldo.mesesRestantes.toFixed(1)} meses`}
        </Text>
      </View>
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    saldoCard: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surfacePrimary,
      borderRadius: raioCard,
      padding: 16,
    },
    saldoLabel: { fontSize: 12, color: tema.textSecondary },
    saldoValor: { fontSize: 28, fontWeight: "700", color: tema.primaryDark, marginTop: 2 },
    linhaReceitaDespesa: { flexDirection: "row", gap: 8 },
    bloco: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: raioCard,
      padding: 12,
    },
    blocoLabel: { fontSize: 11 },
    blocoValor: { fontSize: 14, fontWeight: "700" },
    runwayCard: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      borderRadius: raioCard,
      padding: 12,
    },
    runwayLabel: { fontSize: 11, color: tema.textSecondary },
    runwayValor: { fontSize: 14, fontWeight: "600", color: tema.foreground, marginTop: 2 },
  });
}
