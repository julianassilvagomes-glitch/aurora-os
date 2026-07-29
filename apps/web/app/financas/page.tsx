import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RunwayCard } from "./runway-card";
import { LancamentoForm } from "./lancamento-form";
import { LancamentoList } from "./lancamento-list";
import { CategoriaForm } from "./categoria-form";

export default async function FinancasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: categorias } = await supabase
    .from("categoria_financeira")
    .select("id, nome")
    .eq("ativa", true)
    .order("nome");

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Finanças
        </h1>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← início
        </Link>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-8">
        <RunwayCard />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Novo lançamento
          </h2>
          <LancamentoForm categorias={categorias ?? []} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Categorias
          </h2>
          <CategoriaForm />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Últimos lançamentos
          </h2>
          <LancamentoList />
        </section>
      </div>
    </div>
  );
}
