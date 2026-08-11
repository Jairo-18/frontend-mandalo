import { useEffect, useSyncExternalStore } from 'react';

import { deliveryAccidentService } from '@/services/delivery-accident';

/**
 * Badge del sidebar admin ("Accidentes"): store mínimo a nivel de módulo
 * (mismo patrón que `use-pending-orders-count.ts`/`use-unread-chats.ts`) para
 * que, si en algún momento más de un consumidor lo usa a la vez, comparten el
 * mismo número y una sola petición en vuelo en vez de fetch por instancia.
 *
 * Sin socket dedicado para admin (mismo criterio que `/admin/orders`,
 * pull-to-refresh): se carga al montar el drawer y punto, no hace falta
 * tiempo real para un contador de seguridad.
 */

let count = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getCount(): number {
  return count;
}

function setCount(next: number): void {
  if (next === count) return;
  count = next;
  listeners.forEach((listener) => listener());
}

let inFlight: Promise<void> | null = null;

function refresh(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = deliveryAccidentService
    .unreviewedCount()
    .then(setCount)
    .catch(() => {
      // Silencioso: sin dato no se muestra badge.
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function useUnreviewedAccidentsCount(): number {
  const value = useSyncExternalStore(subscribe, getCount);

  useEffect(() => {
    void refresh();
  }, []);

  return value;
}
