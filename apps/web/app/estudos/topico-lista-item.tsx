import { TopicoNode, type Topico } from "./topico-node";

export function TopicoListaItem({
  numero,
  proximo,
  topico,
  todos,
  disciplinaId,
}: {
  numero: number;
  proximo: boolean;
  topico: Topico;
  todos: Topico[];
  disciplinaId: string;
}) {
  return (
    <li
      className={
        proximo
          ? "rounded-control border border-primary bg-surface-primary px-2"
          : "px-2"
      }
    >
      <div className="flex items-start gap-2 pt-1">
        <span className="mt-1 w-5 shrink-0 text-right text-xs text-text-secondary">
          {numero}.
        </span>
        <div className="flex-1">
          {proximo && (
            <span className="mb-0.5 inline-block rounded-control bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              próximo
            </span>
          )}
          <TopicoNode topico={topico} todos={todos} disciplinaId={disciplinaId} />
        </div>
      </div>
    </li>
  );
}
