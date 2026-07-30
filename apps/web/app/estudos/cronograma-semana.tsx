import { BlocoItem } from "./bloco-item";
import { rotuloCategoria, coresCategoria } from "./categoria-cores";

type Bloco = {
  id: string;
  data: string;
  categoria: string;
  status: string;
  duracao_planejada_min: number;
  disciplina: { nome: string } | null;
  topico: { titulo: string } | null;
};

const diasSemana = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "domingo",
];

function formatarDataCurta(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/** Segunda a domingo da semana que contém `hoje`. */
export function diasDaSemanaAtual(hoje: Date): string[] {
  const diaSemanaIso = (hoje.getDay() + 6) % 7; // 0 = segunda
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() - diaSemanaIso);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda);
    d.setDate(segunda.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function CronogramaSemana({ blocos }: { blocos: Bloco[] }) {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);
  const dias = diasDaSemanaAtual(hoje);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {dias.map((dia, indice) => {
        const ehHoje = dia === hojeStr;
        const blocosDoDia = blocos.filter((b) => b.data === dia);
        const porCategoria = new Map<string, Bloco[]>();
        for (const bloco of blocosDoDia) {
          const lista = porCategoria.get(bloco.categoria) ?? [];
          lista.push(bloco);
          porCategoria.set(bloco.categoria, lista);
        }

        return (
          <div
            key={dia}
            className={
              ehHoje
                ? "rounded-card border border-primary bg-surface-primary p-2"
                : "rounded-card border border-border bg-surface p-2"
            }
          >
            <p className={`mb-2 text-xs font-semibold ${ehHoje ? "text-primary-dark" : "text-text-secondary"}`}>
              {diasSemana[indice]}
              <span className="ml-1 font-normal">{formatarDataCurta(dia)}</span>
            </p>
            {blocosDoDia.length === 0 ? (
              <p className="text-[11px] text-text-secondary">nada planejado</p>
            ) : (
              <div className="flex flex-col gap-2">
                {[...porCategoria.entries()].map(([categoria, itens]) => {
                  const cores = coresCategoria(categoria);
                  return (
                    <div key={categoria} className={`rounded-control ${cores.bg} p-1.5`}>
                      <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${cores.text}`}>
                        {rotuloCategoria[categoria] ?? categoria}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {itens.map((bloco) => (
                          <BlocoItem key={bloco.id} bloco={bloco} textClassName={cores.text} />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
