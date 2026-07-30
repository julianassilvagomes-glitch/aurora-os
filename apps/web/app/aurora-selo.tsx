/**
 * Selo decorativo acima do título de login — mesma exceção deliberada de
 * gradiente já documentada para o cabeçalho de login antigo, só que agora
 * concentrada neste ícone pequeno em vez de uma faixa inteira da tela.
 */
export function AuroraSelo() {
  return (
    <div
      className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(155deg, #1c3a63 0%, #14243d 55%, #0a1220 100%)",
      }}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <path
          d="M -4 40 C 12 30, 24 46, 40 32 S 60 20, 70 26 L 70 70 L -4 70 Z"
          fill="rgba(255,255,255,0.10)"
        />
        <path
          d="M -4 48 C 14 40, 26 52, 42 40 S 58 32, 70 36 L 70 70 L -4 70 Z"
          fill="rgba(255,255,255,0.06)"
        />
      </svg>
    </div>
  );
}
