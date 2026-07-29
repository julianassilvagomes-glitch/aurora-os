import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export function estaOnline(state: NetInfoState): boolean {
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export async function verificarOnlineAgora(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return estaOnline(state);
}

export function assinarConectividade(
  callback: (online: boolean) => void
): () => void {
  return NetInfo.addEventListener((state) => callback(estaOnline(state)));
}
