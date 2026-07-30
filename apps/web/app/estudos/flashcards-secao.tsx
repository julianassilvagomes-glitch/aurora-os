import { createClient } from "@/lib/supabase/server";
import { FlashcardReview } from "./flashcard-review";
import { FlashcardForm } from "./flashcard-form";

export async function FlashcardsSecao() {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ data: fila, error }, { data: topicos }] = await Promise.all([
    supabase
      .from("flashcard")
      .select("id, frente, verso, topico:topico_id(titulo)")
      .eq("ativo", true)
      .lte("proxima_revisao", hoje)
      .order("proxima_revisao"),
    supabase.from("topico_edital").select("id, titulo").order("titulo"),
  ]);

  if (error) return <p className="text-sm text-danger">{error.message}</p>;

  return (
    <div className="flex flex-col gap-3">
      <FlashcardReview fila={fila ?? []} />
      <FlashcardForm topicos={topicos ?? []} />
    </div>
  );
}
