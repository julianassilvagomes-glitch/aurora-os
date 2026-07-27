import { createClient } from "@/lib/supabase/server";

export async function CategoriaList({ userEmail }: { userEmail: string }) {
  const supabase = await createClient();
  const { data: categorias, error } = await supabase
    .from("categoria_financeira")
    .select("id, nome, grupo, ativa")
    .order("nome");

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Autenticada como {userEmail}
      </p>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      <ul className="flex flex-col gap-2">
        {categorias?.length ? (
          categorias.map((c) => (
            <li
              key={c.id}
              className="rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            >
              {c.nome} — {c.grupo}
            </li>
          ))
        ) : (
          <li className="text-sm text-zinc-500">
            Nenhuma categoria financeira cadastrada ainda.
          </li>
        )}
      </ul>
    </div>
  );
}
