import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useChatMessages } from '@/lib/orders-socket';
import { chatService } from '@/services/chat';

/**
 * Contador GLOBAL de mensajes de chat sin leer (burbuja del sidebar de
 * USER y DELI). Store mínimo a nivel de módulo para que todos los sidebars
 * y pantallas compartan el mismo número y se actualicen juntos.
 *
 * Regla React Compiler (§23 de NOTAS): el snapshot ES el dato (primitivo).
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

/** Reconsulta el total (silencioso). La llama el chat tras marcar leídos. */
export async function refreshUnreadChats(): Promise<void> {
  try {
    setCount(await chatService.unreadCount());
  } catch {
    // Sin red/sesión: el badge conserva su último valor.
  }
}

/** Limpieza en el logout (que la cuenta siguiente no herede el badge). */
export function resetUnreadChats(): void {
  setCount(0);
}

/**
 * Total de no-leídos en vivo: carga al montar y se refresca con cada
 * `chat:message` del socket.
 */
export function useUnreadChats(): number {
  const value = useSyncExternalStore(subscribe, getCount);

  useEffect(() => {
    void refreshUnreadChats();
  }, []);

  useChatMessages(
    useCallback(() => {
      void refreshUnreadChats();
    }, []),
  );

  return value;
}
