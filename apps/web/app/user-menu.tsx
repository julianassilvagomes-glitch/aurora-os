"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function nomeDeExibicao(email: string) {
  const local = email.split("@")[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function UserMenu({ email }: { email: string }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nome = nomeDeExibicao(email);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-control border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
          {nome.charAt(0)}
        </span>
        {nome}
      </button>

      {aberto && (
        <div className="absolute right-0 z-10 mt-2 w-44 rounded-card border border-border bg-surface p-1 shadow-sm">
          <span className="block cursor-default rounded-control px-3 py-2 text-sm text-text-secondary">
            Perfil <span className="text-xs">(em breve)</span>
          </span>
          <span className="block cursor-default rounded-control px-3 py-2 text-sm text-text-secondary">
            Configurações <span className="text-xs">(em breve)</span>
          </span>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={sair}
            className="block w-full rounded-control px-3 py-2 text-left text-sm text-danger hover:bg-background"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
