import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { raioCard, raioControle, useTema, type Tema } from "../lib/theme";

export function LoginScreen() {
  const tema = useTema();
  const estilos = useMemo(() => criarEstilos(tema), [tema]);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setCarregando(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setCarregando(false);
    if (error) setErro(error.message);
  }

  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>Aurora OS</Text>
      <TextInput
        style={estilos.input}
        placeholder="email"
        placeholderTextColor={tema.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={estilos.input}
        placeholder="senha"
        placeholderTextColor={tema.textSecondary}
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />
      {erro && <Text style={estilos.erro}>{erro}</Text>}
      <TouchableOpacity style={estilos.botao} onPress={entrar} disabled={carregando}>
        {carregando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={estilos.botaoTexto}>Entrar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function criarEstilos(tema: Tema) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
      gap: 12,
      backgroundColor: tema.background,
    },
    titulo: {
      fontSize: 24,
      fontWeight: "600",
      marginBottom: 12,
      textAlign: "center",
      color: tema.primaryDark,
    },
    input: {
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      color: tema.foreground,
      borderRadius: raioControle,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    erro: { color: tema.danger, fontSize: 13 },
    botao: {
      backgroundColor: tema.primary,
      borderRadius: raioCard,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 4,
    },
    botaoTexto: { color: "#fff", fontWeight: "600" },
  });
}
