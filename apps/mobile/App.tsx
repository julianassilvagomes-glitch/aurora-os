import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { LoginScreen } from "./screens/LoginScreen";
import { FinancasScreen } from "./screens/FinancasScreen";
import { useTema } from "./lib/theme";

export default function App() {
  const tema = useTema();
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });

    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
    });

    return () => assinatura.subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tema.background }]}>
      {carregando ? (
        <ActivityIndicator style={styles.carregando} color={tema.primary} />
      ) : session ? (
        <FinancasScreen />
      ) : (
        <LoginScreen />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  carregando: { flex: 1, justifyContent: "center" },
});
