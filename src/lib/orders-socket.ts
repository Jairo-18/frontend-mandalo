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

/** Posición en vivo del repartidor de un pedido (relay del gateway). */
export type DeliveryPosition = {
  invoiceId: number;
  latitude: number;
  longitude: number;
  at: number;
};

/**
 * El repartidor reporta su posición GPS para un pedido EN RUTA. El gateway
 * valida en el backend que sea el asignado; acá solo se emite.
 */
export function emitDeliveryPosition(
  invoiceId: number,
  coords: { latitude: number; longitude: number },
): void {
  getOrdersSocket()?.emit('delivery:position', { invoiceId, ...coords });
}

/**
 * Posición en vivo del repartidor (la escuchan cliente y negocio). El handler
 * debe venir memoizado; el payload trae el invoiceId — filtra el caller.
 */
export function useDeliveryPosition(
  handler: (position: DeliveryPosition) => void,
): void {
  useEffect(() => {
    const s = getOrdersSocket();
    if (!s) return;
    const cb = (payload: DeliveryPosition) => handler(payload);
    s.on('delivery:position', cb);
    return () => {
      s.off('delivery:position', cb);
    };
  }, [handler]);
}

/** Mensaje de chat en vivo (relay del gateway a las salas de ambos). */
export type ChatSocketEvent = {
  invoiceId: number;
  message: {
    id: number;
    senderUserId: string;
    body: string;
    createdAt: string;
  };
};

/**
 * Mensajes de chat en vivo. El payload trae el invoiceId — filtra el caller
 * (la pantalla del chat filtra su hilo; la lista de chats refresca todo).
 * El handler debe venir memoizado.
 */
export function useChatMessages(
  handler: (event: ChatSocketEvent) => void,
): void {
  useEffect(() => {
    const s = getOrdersSocket();
    if (!s) return;
    const cb = (payload: ChatSocketEvent) => handler(payload);
    s.on('chat:message', cb);
    return () => {
      s.off('chat:message', cb);
    };
  }, [handler]);
}

/** El negocio le pidió al cliente el comprobante del pago (relay del gateway). */
export type PaymentRequestedEvent = { invoiceId: number; message: string };

/**
 * Aviso en vivo de "el negocio necesita tu comprobante de pago" al cliente
 * dueño. El handler debe venir memoizado. Complementa el push (app cerrada).
 */
export function usePaymentRequested(
  handler: (event: PaymentRequestedEvent) => void,
): void {
  useEffect(() => {
    const s = getOrdersSocket();
    if (!s) return;
    const cb = (payload: PaymentRequestedEvent) => handler(payload);
    s.on('invoice:payment-requested', cb);
    return () => {
      s.off('invoice:payment-requested', cb);
    };
  }, [handler]);
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
