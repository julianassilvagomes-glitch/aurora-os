import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SaldoCards } from "./saldo-cards";
import { LancamentoForm } from "./lancamento-form";
import { LancamentoList } from "./lancamento-list";
import { CategoriaManager } from "./categoria-manager";
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
    <div className="flex min-h-screen flex-col items-center gap-8 bg-background px-6 py-16">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary-dark">Finanças</h1>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← início
        </Link>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-8">
        <SaldoCards />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-text-secondary">
            Novo lançamento
          </h2>
          <LancamentoForm categorias={categorias ?? []} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-text-secondary">
            Categorias
          </h2>
          <CategoriaManager />
          <CategoriaForm />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-text-secondary">
            Últimos lançamentos
          </h2>
          <LancamentoList />
        </section>
      </div>
    </div>
  );
}
