"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAviso(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function esqueciSenha() {
    setError(null);
    setAviso(null);
    if (!email) {
      setError("Digite seu email acima antes de pedir a redefinição de senha.");
      return;
    }
    setEnviandoReset(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setEnviandoReset(false);
    if (error) {
      setError(error.message);
      return;
    }
    setAviso("Se esse email tiver uma conta, enviamos um link de redefinição.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-border bg-surface p-6"
    >
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-control border border-border bg-background px-3 py-2 text-foreground"
        required
      />
      <input
        type="password"
        placeholder="senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-control border border-border bg-background px-3 py-2 text-foreground"
        required
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {aviso && <p className="text-sm text-success">{aviso}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-control bg-primary px-3 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <button
        type="button"
        onClick={esqueciSenha}
        disabled={enviandoReset}
        className="text-center text-sm text-primary hover:underline disabled:opacity-50"
      >
        {enviandoReset ? "Enviando..." : "Esqueci a senha"}
      </button>
    </form>
  );
}
