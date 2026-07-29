import { useCallback, useEffect, useRef, useState } from "react";
import { assinarConectividade, verificarOnlineAgora } from "../lib/net";
import { atualizarCategoriasCache } from "../lib/categorias";
import { atualizarLancamentosConfirmados, processarFila } from "../lib/lancamentos";
import { lerFila } from "../lib/outbox";

export function useSincronizacao() {
  const [online, setOnline] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const [versao, setVersao] = useState(0);
  const sincronizandoRef = useRef(false);

  const atualizarContadorPendentes = useCallback(async () => {
    const fila = await lerFila();
    setPendentes(fila.length);
  }, []);

  const sincronizarAgora = useCallback(async () => {
    if (sincronizandoRef.current) return;
    sincronizandoRef.current = true;
    setSincronizando(true);
    try {
      const aindaOnline = await verificarOnlineAgora();
      if (!aindaOnline) return;
      await processarFila();
      await Promise.all([
        atualizarCategoriasCache(),
        atualizarLancamentosConfirmados(),
      ]);
      await atualizarContadorPendentes();
      setVersao((v) => v + 1);
    } finally {
      sincronizandoRef.current = false;
      setSincronizando(false);
    }
  }, [atualizarContadorPendentes]);

  useEffect(() => {
    atualizarContadorPendentes();
    verificarOnlineAgora().then((estaOnline) => {
      setOnline(estaOnline);
      if (estaOnline) sincronizarAgora();
    });

    const cancelar = assinarConectividade((novoEstado) => {
      setOnline((eraOnline) => {
        if (novoEstado && !eraOnline) sincronizarAgora();
        return novoEstado;
      });
    });

    return cancelar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notificarMudancaLocal = useCallback(() => {
    atualizarContadorPendentes();
    setVersao((v) => v + 1);
    if (online) sincronizarAgora();
  }, [online, atualizarContadorPendentes, sincronizarAgora]);

  return { online, sincronizando, pendentes, versao, sincronizarAgora, notificarMudancaLocal };
}
