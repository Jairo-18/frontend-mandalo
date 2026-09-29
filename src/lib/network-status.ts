import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSyncExternalStore } from 'react';

export type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  /**
   * `true` SOLO con una señal confirmada de que no hay internet — nunca al
   * arrancar la app, cuando `isInternetReachable` todavía es `null`
   * (indeterminado, NetInfo aún no terminó su primer chequeo). Evita que el
   * banner de "sin conexión" parpadee al abrir la app con buena señal.
   */
  isOffline: boolean;
};

const INITIAL: NetworkStatus = {
  isConnected: true,
  isInternetReachable: null,
  isOffline: false,
};

let current: NetworkStatus = INITIAL;
const listeners = new Set<() => void>();
let unsubscribeNetInfo: (() => void) | null = null;

function apply(state: NetInfoState): void {
  const isConnected = state.isConnected ?? true;
  current = {
    isConnected,
    isInternetReachable: state.isInternetReachable,
    isOffline: isConnected === false || state.isInternetReachable === false,
  };
  listeners.forEach((l) => l());
}

function ensureStarted(): void {
  if (unsubscribeNetInfo) return;
  unsubscribeNetInfo = NetInfo.addEventListener(apply);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureStarted();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): NetworkStatus {
  return current;
}

/**
 * Chequeo síncrono para código NO-React (p. ej. `lib/http.ts`, que no puede
 * usar hooks): `true` solo con la señal offline confirmada. Antes de la
 * primera lectura de NetInfo (que llega async) devuelve `false` — el `fetch`
 * real sigue siendo la fuente de verdad hasta que NetInfo se pone al día.
 */
export function isKnownOffline(): boolean {
  ensureStarted();
  return current.isOffline;
}

/** Estado de conectividad reactivo — para banners/pantallas. */
export function useNetworkStatus(): NetworkStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
