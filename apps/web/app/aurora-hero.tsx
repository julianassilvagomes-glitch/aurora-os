/**
 * Exceção deliberada à regra "sem gradiente" do sistema de design — vale
 * só para este cabeçalho da tela de login (o resto da tela permanece
 * sóbrio: cartão neutro, botão único em azul médio).
 */
export function AuroraHero() {
  return (
    <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-[#050a14] sm:h-56">
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-60px] left-1/3 h-64 w-80 rounded-full bg-blue-500/35 blur-3xl" />
      <h1 className="relative text-2xl font-semibold tracking-[0.3em] text-white">
        AURORA OS
      </h1>
    </div>
  );
}
