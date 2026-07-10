import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

import { API_URL } from '@/constants/api';
import { getSession } from '@/lib/session';

/** Payload común de los eventos de pedido (siempre trae al menos el id). */
export type OrderEvent = { id: number; [key: string]: unknown };

/** Eventos que emite el gateway `/orders` del backend (§23 de NOTAS). */
const ORDER_EVENTS = [
  'invoice:created',
  'invoice:updated',
  'invoice:available',
  'invoice:taken',
] as const;

let socket: Socket | null = null;

/**
 * Socket singleton al namespace `/orders` (autenticado con el accessToken de
 * la sesión). Se conecta perezosamente la primera vez que una pantalla se
 * suscribe. Con una sola instancia del backend no hace falta Redis (§21).
 */
function getOrdersSocket(): Socket | null {
  const token = getSession()?.accessToken;
  if (!token) return null;

  if (!socket) {
    socket = io(`${API_URL}/orders`, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
    });
  }
  return socket;
}

/** Se llama al cerrar sesión: corta la conexión para reconectar con otro token. */
export function disconnectOrdersSocket(): void {
  socket?.disconnect();
  socket = null;
}

/**
 * Suscribe un handler a los eventos de pedido en vivo. El handler debe venir
 * memoizado (useCallback). Es tolerante: si no hay sesión/socket, no hace
 * nada (las pantallas igual funcionan con pull-to-refresh).
 */
export function useOrderEvents(handler: (payload: OrderEvent) => void): void {
  useEffect(() => {
    const s = getOrdersSocket();
    if (!s) return;

    const cb = (payload: OrderEvent) => handler(payload);
    ORDER_EVENTS.forEach((event) => s.on(event, cb));
    return () => {
      ORDER_EVENTS.forEach((event) => s.off(event, cb));
    };
  }, [handler]);
}
