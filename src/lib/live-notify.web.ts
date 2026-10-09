import { useCallback, useEffect } from 'react';

import {
  ChatSocketEvent,
  OrderEventName,
  useChatMessages,
  useOrderEvents,
} from '@/lib/orders-socket';

/**
 * Avisos del sistema en la versión web. `expo-notifications` no soporta el
 * navegador, así que acá se usa la Notifications API nativa del navegador
 * alimentada por los eventos que YA llegan por el socket.
 *
 * ⚠️ Alcance real, para no prometer de más: esto solo funciona con la pestaña
 * ABIERTA (en segundo plano sí, minimizada también, pero abierta). Notificar
 * con el navegador cerrado exige un Service Worker + Web Push con claves VAPID,
 * que es otra arquitectura. En nativo eso ya lo cubre el push de Expo.
 *
 * Por eso el contador en el título (`(3) Mandalo`) va SIEMPRE, aunque el
 * usuario haya negado el permiso de notificaciones: es el aviso que nunca
 * depende de permisos.
 */

const ORDER_TEXT: Record<OrderEventName, string> = {
  'invoice:created': 'Entró un pedido nuevo.',
  'invoice:updated': 'Un pedido cambió de estado.',
  'invoice:available': 'Hay un pedido disponible para tomar.',
  'invoice:taken': 'Un repartidor tomó el pedido.',
};

/** Pestaña en segundo plano: con el usuario mirando, la lista ya se actualiza sola. */
function isHidden(): boolean {
  return typeof document !== 'undefined' && document.hidden;
}

function canNotify(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// ---- Contador en el título de la pestaña (no necesita permisos) ----
let unread = 0;
let baseTitle = '';

function bumpTitle(): void {
  if (typeof document === 'undefined') return;
  if (!baseTitle) baseTitle = document.title;
  unread += 1;
  document.title = `(${unread}) ${baseTitle}`;
}

function resetTitle(): void {
  if (typeof document === 'undefined' || !baseTitle) return;
  unread = 0;
  document.title = baseTitle;
}

/**
 * `tag` hace que un mismo pedido REEMPLACE su aviso anterior en vez de apilar
 * uno por cada cambio de estado (el flujo de un pedido dispara varios).
 */
function show(title: string, body: string, tag: string): void {
  if (!canNotify() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag, icon: '/favicon.ico' });
  } catch {
    // Safari es quisquilloso con el constructor; el título ya avisó igual.
  }
}

/** Estado del permiso de avisos del navegador. */
export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotifyPermission(): NotifyPermission {
  return canNotify() ? Notification.permission : 'unsupported';
}

/** Solo debe llamarse desde un gesto del usuario (ver `<WebNotifyRow/>`). */
export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (!canNotify()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return getNotifyPermission();
  }
}

export function useLiveNotifications(): void {

  // El permiso NO se pide acá. Varios navegadores solo lo conceden desde un
  // gesto del usuario, y solo se puede preguntar UNA vez de forma útil: pedirlo
  // al arrancar la desperdiciaría en una llamada que puede fallar sin más. Lo
  // dispara el usuario desde `<WebNotifyRow/>` en su perfil.

  // Volver a la pestaña limpia el contador.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisible = () => {
      if (!document.hidden) resetTitle();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const onOrder = useCallback((payload: { id: number; deleted?: unknown }, event: OrderEventName) => {
    // Un admin eliminó el pedido: no es una novedad que avisar.
    if (payload.deleted || !isHidden()) return;
    bumpTitle();
    show('Mandalo', ORDER_TEXT[event], `order-${payload.id}`);
  }, []);
  useOrderEvents(onOrder);

  const onChat = useCallback((event: ChatSocketEvent) => {
    if (!isHidden()) return;
    bumpTitle();
    show('Nuevo mensaje', event.message.body, `chat-${event.invoiceId}`);
  }, []);
  useChatMessages(onChat);
}
