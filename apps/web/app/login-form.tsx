"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuroraSelo } from "./aurora-selo";
import { GoogleIcon } from "./google-icon";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [entrandoComGoogle, setEntrandoComGoogle] = useState(false);

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

  async function entrarComGoogle() {
    setError(null);
    setEntrandoComGoogle(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setEntrandoComGoogle(false);
      setError(error.message);
    }
    // em caso de sucesso o navegador é redirecionado pro Google — sem mais nada a fazer aqui
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-card border border-border bg-surface p-8">
      <AuroraSelo />
      <div className="text-center">
        <h1 className="text-xl font-semibold text-primary-dark">Aurora OS</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Entre para acessar o app que organiza toda a sua vida
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <input
          type="email"
          placeholder="e-mail"
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

      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-secondary">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={entrarComGoogle}
        disabled={entrandoComGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-50"
      >
        <GoogleIcon className="h-4 w-4" />
        {entrandoComGoogle ? "Redirecionando..." : "Entrar com Google"}
      </button>
    </div>
  );
}
