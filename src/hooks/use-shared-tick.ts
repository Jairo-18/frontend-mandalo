import { useSyncExternalStore } from 'react';

const INTERVAL_MS = 30_000;

let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function ensureTimer(): void {
  if (timer) return;
  timer = setInterval(() => {
    now = Date.now();
    listeners.forEach((l) => l());
  }, INTERVAL_MS);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureTimer();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  return now;
}

/**
 * "Ahora" (ms epoch) compartido entre TODAS las `OrderEta` montadas a la
 * vez (cada tarjeta de la lista + el detalle abierto): un solo
 * `setInterval` de 30s en vez de uno por tarjeta — con ~20 pedidos en
 * pantalla, antes eran 20 timers casi simultáneos re-renderizando la lista
 * entera cada 30s; ahora es un solo tick que React batchea en un solo pase.
 * El timer arranca con el primer suscriptor y se apaga solo sin ninguno.
 */
export function useSharedTick(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
