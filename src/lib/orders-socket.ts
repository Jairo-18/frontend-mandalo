import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';

import { API_URL } from '@/constants/api';
import { getSession, subscribeSession } from '@/lib/session';

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

// Si el socket se cae (wifi/datos) y vuelve, socket.io reconecta solo pero
// NO reenvía lo que pasó mientras estuvo desconectado (p. ej. el cliente
// subió el comprobante mientras el negocio no tenía señal) — sin esto, la
// pantalla se queda desactualizada hasta el próximo evento nuevo o un
// pull-to-refresh manual. `hasConnectedOnce` distingue la conexión inicial
// (no hay nada que "recuperar" todavía) de una reconexión real.
let hasConnectedOnce = false;
const reconnectListeners = new Set<() => void>();

// Usuario con el que se abrió el socket: si la sesión pasa a otra cuenta (o se
// borra sin pasar por signOut, p. ej. refreshToken rechazado), se cierra.
let socketUserId: string | null = null;

/**
 * Handlers por evento. Las pantallas se suscriben AQUÍ, no a la instancia del
 * socket: antes cada hook hacía `socket.on(...)` al montar y, si en ese momento
 * no había sesión o el socket se recreaba después (cerrar sesión y entrar con
 * otra cuenta), la pantalla quedaba sorda para siempre (cobros y dashboards sin
 * actualizar, badge sin sumar). Un único `onAny` del socket reparte a todos.
 */
type AnyHandler = (payload: any) => void;
const eventHandlers = new Map<string, Set<AnyHandler>>();

function hasSubscribers(): boolean {
  if (reconnectListeners.size > 0) return true;
  for (const set of eventHandlers.values()) if (set.size > 0) return true;
  return false;
}

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
      // Función, no objeto: se evalúa en CADA (re)conexión con el token
      // vigente. Con `{ token }` fijo, el socket reconectaba con el token del
      // momento en que se creó (p. ej. el guardado de ayer, antes del refresh
      // del arranque): el backend lo rechazaba y la app quedaba sin eventos
      // en vivo (badge de pedidos, cobros, avisos) hasta cerrar sesión.
      auth: (cb) => cb({ token: getSession()?.accessToken }),
      autoConnect: true,
    });
    socketUserId = getSession()?.user.id ?? null;
    socket.onAny((event: string, payload: unknown) => {
      eventHandlers.get(event)?.forEach((h) => h(payload));
    });
    socket.on('connect', () => {
      reportAppState(AppState.currentState);
      if (hasConnectedOnce) {
        reconnectListeners.forEach((l) => l());
      }
      hasConnectedOnce = true;
    });
    // Si el SERVIDOR cierra la conexión (token rechazado/vencido), socket.io
    // NO reintenta solo. Se reintenta con el token que haya para entonces.
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') scheduleReconnect();
    });
  }
  return socket;
}

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (socket && !socket.connected && getSession()?.accessToken) socket.connect();
  }, 5000);
}

/**
 * Le dice al backend si la app está en primer o segundo plano. El socket
 * sigue conectado un rato con la app minimizada y el backend decide con esto
 * si el mensaje de chat necesita push (`chat.service.ts`).
 */
function reportAppState(state: AppStateStatus): void {
  // 'inactive' (iOS: centro de control, llamada entrante) cuenta como abierta.
  socket?.emit('app:state', {
    state: state === 'background' ? 'background' : 'foreground',
  });
}

AppState.addEventListener('change', (state) => {
  reportAppState(state);
  // Al volver a la app: si el socket quedó caído, reconectar ya.
  if (state === 'active' && socket && !socket.connected) socket.connect();
});

/** Se llama al cerrar sesión: corta la conexión para reconectar con otro token. */
export function disconnectOrdersSocket(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  socket?.disconnect();
  socket = null;
  socketUserId = null;
  hasConnectedOnce = false;
}

// Sesión nueva (login, arranque) → abre el socket si alguna pantalla escucha;
// sesión de OTRA cuenta o sin sesión → cierra el del usuario anterior.
subscribeSession(() => {
  const userId = getSession()?.user.id ?? null;
  if (socket && userId !== socketUserId) disconnectOrdersSocket();
  if (userId && !socket && hasSubscribers()) getOrdersSocket();
});

/**
 * Suscribe `handler` a un evento del gateway. No depende de que el socket
 * exista al montar: si se crea (o se recrea) después, el handler igual recibe.
 */
function useSocketEvent<T>(event: string, handler: (payload: T) => void): void {
  useEffect(() => {
    let set = eventHandlers.get(event);
    if (!set) {
      set = new Set();
      eventHandlers.set(event, set);
    }
    const h = handler as AnyHandler;
    set.add(h);
    getOrdersSocket();
    return () => {
      set.delete(h);
    };
  }, [event, handler]);
}

/**
 * Se dispara cuando el socket se RECONECTA tras haberse caído (no en la
 * conexión inicial) — la pantalla debe refrescarse porque pudo perderse
 * algún evento mientras estuvo desconectada. El handler debe venir
 * memoizado (useCallback).
 */
export function useSocketReconnected(handler: () => void): void {
  useEffect(() => {
    reconnectListeners.add(handler);
    getOrdersSocket();
    return () => {
      reconnectListeners.delete(handler);
    };
  }, [handler]);
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
  useSocketEvent<DeliveryPosition>('delivery:position', handler);
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
  useSocketEvent<ChatSocketEvent>('chat:message', handler);
}

/** El catálogo del negocio cambió (producto creado, editado, borrado o fotos). */
export type ProductChangedEvent = {
  productId: number;
  action: 'created' | 'updated' | 'deleted';
};

/**
 * Cambios del catálogo en vivo: llegan a TODOS los dispositivos con sesión del
 * mismo negocio (room `org:{id}`), así la misma cuenta abierta en dos teléfonos
 * ve al instante lo que se hizo en el otro. El handler debe venir memoizado.
 */
export function useProductChanges(
  handler: (event: ProductChangedEvent) => void,
): void {
  useSocketEvent<ProductChangedEvent>('product:changed', handler);
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
  useSocketEvent<PaymentRequestedEvent>('invoice:payment-requested', handler);
}

/** Nombre de evento del gateway (para que el caller decida qué refrescar). */
export type OrderEventName = (typeof ORDER_EVENTS)[number];

/**
 * Suscribe un handler a los eventos de pedido en vivo. El handler debe venir
 * memoizado (useCallback). Es tolerante: si no hay sesión/socket, no hace
 * nada (las pantallas igual funcionan con pull-to-refresh). El 2º argumento
 * (nombre del evento) es opcional — quien no lo necesita simplemente no lo
 * declara en su callback.
 */
export function useOrderEvents(
  handler: (payload: OrderEvent, event: OrderEventName) => void,
): void {
  useEffect(() => {
    const subs = ORDER_EVENTS.map((event) => {
      let set = eventHandlers.get(event);
      if (!set) {
        set = new Set();
        eventHandlers.set(event, set);
      }
      const cb: AnyHandler = (payload: OrderEvent) => handler(payload, event);
      set.add(cb);
      return { set, cb };
    });
    getOrdersSocket();
    return () => {
      subs.forEach(({ set, cb }) => set.delete(cb));
    };
  }, [handler]);
}
