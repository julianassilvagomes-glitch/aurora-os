import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoberturaPainel } from "./cobertura-painel";
import { EditalTree } from "./edital-tree";
import { CronogramaList } from "./cronograma-list";
import { QuestoesSecao } from "./questoes-secao";
import { FlashcardsSecao } from "./flashcards-secao";

export default async function EstudosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-background px-6 py-16">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary-dark">Estudos</h1>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← início
        </Link>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-8">
        <CoberturaPainel />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-text-secondary">Edital verticalizado</h2>
          <EditalTree />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-text-secondary">Cronograma</h2>
          <CronogramaList />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-text-secondary">Banco de questões</h2>
          <QuestoesSecao />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-text-secondary">Flashcards — fila do dia</h2>
          <FlashcardsSecao />
        </section>
      </div>
    </div>
  );
}
