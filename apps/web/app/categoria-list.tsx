import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function CategoriaList({ userEmail }: { userEmail: string }) {
  const supabase = await createClient();
  const { data: categorias, error } = await supabase
    .from("categoria_financeira")
    .select("id, nome, grupo, ativa")
    .order("nome");

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Autenticada como {userEmail}
        </p>
        <Link href="/financas" className="text-sm font-medium text-primary hover:underline">
          finanças →
        </Link>
      </div>
      {error && <p className="text-sm text-danger">{error.message}</p>}
      <ul className="flex flex-col gap-2">
        {categorias?.length ? (
          categorias.map((c) => (
            <li
              key={c.id}
              className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              {c.nome} — {c.grupo}
            </li>
          ))
        ) : (
          <li className="text-sm text-text-secondary">
            Nenhuma categoria financeira cadastrada ainda.
          </li>
        )}
      </ul>
    </div>
  );
}
