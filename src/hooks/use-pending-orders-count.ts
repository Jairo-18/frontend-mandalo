import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useOrderEvents } from '@/lib/orders-socket';
import { ordersService } from '@/services/orders';

/**
 * Contador GLOBAL de pedidos PENDIENTES del negocio (badge del sidebar +
 * tarjeta del dashboard, §auditoría de peticiones): store mínimo a nivel de
 * módulo (mismo patrón que `use-unread-chats.ts`) para que TODOS los
 * consumidores compartan el mismo número y una sola petición en vuelo, en vez
 * de que cada `usePendingOrdersCount()` dispare su propio fetch.
 *
 * Se refresca con los eventos del socket `/orders` (`invoice:created` cuando
 * entra un pedido, `invoice:updated` cuando cambia de estado — aceptar/
 * cancelar lo baja). Si el socket no conecta, queda con el valor de la carga
 * inicial.
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

// Petición en curso (si hay una): deduplica llamadas casi simultáneas de
// varios consumidores (badge del drawer + tarjeta del dashboard).
let inFlight: Promise<void> | null = null;

function refresh(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = ordersService
    .pendingCount()
    .then(setCount)
    .catch(() => {
      // Silencioso: sin dato no se muestra badge (pendingCount no toastea).
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function usePendingOrdersCount(): number {
  const value = useSyncExternalStore(subscribe, getCount);

  useEffect(() => {
    void refresh();
  }, []);

  useOrderEvents(
    useCallback(() => {
      void refresh();
    }, []),
  );

  return value;
}
