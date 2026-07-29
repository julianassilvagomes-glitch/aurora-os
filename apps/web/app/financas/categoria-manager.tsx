import { createClient } from "@/lib/supabase/server";
import { CategoriaRow } from "./categoria-row";

export async function CategoriaManager() {
  const supabase = await createClient();
  const { data: categorias, error } = await supabase
    .from("categoria_financeira")
    .select("id, nome, grupo, ativa, lancamento_financeiro(count)")
    .order("nome");

  if (error) {
    return <p className="text-sm text-danger">{error.message}</p>;
  }

  if (!categorias?.length) {
    return (
      <p className="text-sm text-text-secondary">Nenhuma categoria cadastrada ainda.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {categorias.map((categoria) => (
        <CategoriaRow
          key={categoria.id}
          categoria={categoria}
          temLancamentos={(categoria.lancamento_financeiro?.[0]?.count ?? 0) > 0}
        />
      ))}
    </ul>
  );
}
