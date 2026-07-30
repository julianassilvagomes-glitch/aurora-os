import Link from "next/link";
import { Wallet, BookOpen, Repeat } from "lucide-react";

const modulos = [
  {
    titulo: "Finanças",
    descricao: "Runway, lançamentos e categorias",
    icone: Wallet,
    href: "/financas",
    disponivel: true,
  },
  {
    titulo: "Estudos",
    descricao: "Edital, cronograma e flashcards",
    icone: BookOpen,
    href: "/estudos",
    disponivel: true,
  },
  {
    titulo: "Rotinas",
    descricao: "Agenda do dia e hábitos",
    icone: Repeat,
    href: null,
    disponivel: false,
  },
];

export function ModuleCards() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
      {modulos.map((modulo) => {
        const Icone = modulo.icone;
        const conteudo = (
          <>
            <Icone className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="font-medium text-foreground">
                {modulo.titulo}
                {!modulo.disponivel && (
                  <span className="ml-1.5 text-xs font-normal text-text-secondary">
                    em breve
                  </span>
                )}
              </p>
              <p className="text-sm text-text-secondary">{modulo.descricao}</p>
            </div>
          </>
        );

        if (modulo.disponivel && modulo.href) {
          return (
            <Link
              key={modulo.titulo}
              href={modulo.href}
              className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 hover:border-primary"
            >
              {conteudo}
            </Link>
          );
        }

        return (
          <div
            key={modulo.titulo}
            className="flex cursor-default flex-col gap-2 rounded-card border border-border bg-surface p-4 opacity-60"
          >
            {conteudo}
          </div>
        );
      })}
    </div>
  );
}
