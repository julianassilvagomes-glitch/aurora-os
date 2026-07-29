"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSucesso(true);
    setTimeout(() => router.push("/"), 1500);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary-dark">Redefinir senha</h1>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-border bg-surface p-6"
      >
        <input
          type="password"
          placeholder="nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          className="rounded-control border border-border bg-background px-3 py-2 text-foreground"
          required
          minLength={6}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {sucesso && (
          <p className="text-sm text-success">Senha atualizada. Voltando ao início…</p>
        )}
        <button
          type="submit"
          disabled={loading || sucesso}
          className="rounded-control bg-primary px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
