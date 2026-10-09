import * as Notifications from 'expo-notifications';
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useSession } from '@/hooks/use-session';
import {
  ChatSocketEvent,
  OrderEvent,
  OrderEventName,
  useChatMessages,
  useOrderEvents,
} from '@/lib/orders-socket';
import { stateMeta } from '@/lib/order-status';
import { CHANNEL_ID, setActiveChatThread, usePushUnavailable } from '@/lib/push';

// Módulo nativo local (raíz del repo, `modules/`), fuera del alias `@/`.
import { playMessageSound } from '../../modules/notify-sound';

/**
 * Sonido + aviso con la app ABIERTA, para lo que el push no cubre.
 *
 * - **Chat**: el backend manda el push SOLO si el destinatario no tiene la
 *   app en primer plano (`chat.service.ts`, con el `app:state` que reporta
 *   `orders-socket.ts`). Con la app abierta se dispara acá una notificación
 *   LOCAL (la reproduce el handler de `lib/push.ts`, con el sonido de
 *   notificación del teléfono) salvo que el usuario ya esté mirando ese hilo.
 *   Con la app minimizada NO: ahí ya llega el push y sonaría dos veces.
 * - **Pedidos en un teléfono sin push (Huawei sin GMS)**: ahí no hay FCM, así
 *   que los eventos del socket son lo único que llega — se avisan igual con
 *   notificación local. Con push disponible NO se duplica: el backend ya lo
 *   manda siempre y suena por el handler de primer plano.
 *
 * Montado UNA vez en el layout raíz. En web es un no-op (ver `.web.ts`).
 */

/** Notificación local inmediata (suena con el sonido del sistema del canal). */
async function notifyLocal(
  identifier: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, data, sound: true },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // Sin permiso o sin módulo nativo: el aviso es un extra, nunca debe romper.
  }
}

export function useInAppAlerts(): void {
  const session = useSession();
  const myId = session?.user.id;
  const role = session?.user.role?.code;
  const pushUnavailable = usePushUnavailable();
  const pathname = usePathname();

  // El handler de primer plano silencia el push del hilo que está abierto.
  useEffect(() => {
    const match = pathname.match(/^\/chat\/(\d+)$/);
    setActiveChatThread(match ? Number(match[1]) : null);
  }, [pathname]);

  const onChat = useCallback(
    (event: ChatSocketEvent) => {
      if (!myId || event.message.senderUserId === myId) return;
      // Ya está mirando este hilo: sin notificación (el mensaje aparece
      // solo), pero con el "pop" de mensaje recibido, como en las apps de chat.
      if (pathname === `/chat/${event.invoiceId}`) {
        if (AppState.currentState === 'active') void playMessageSound();
        return;
      }
      // Minimizada (y con push): el aviso lo da el push del backend.
      if (AppState.currentState === 'background' && !pushUnavailable) return;
      // Id por mensaje: reemplazar una notificación ya visible no vuelve a
      // sonar en algunos Android, y cada mensaje nuevo tiene que sonar.
      void notifyLocal(
        `chat-${event.message.id}`,
        '💬 Nuevo mensaje',
        event.message.body.length > 120
          ? `${event.message.body.slice(0, 117)}…`
          : event.message.body,
        { type: 'chat', invoiceId: event.invoiceId },
      );
    },
    [myId, pathname, pushUnavailable],
  );
  useChatMessages(onChat);

  // Último estado visto por pedido: 'invoice:updated' llega por TODO cambio
  // (incluidos los que provocó el propio usuario), así que solo se avisa
  // cuando el estado cambió respecto al anterior.
  const lastState = useRef(new Map<number, string>());

  const onOrder = useCallback(
    (payload: OrderEvent, event: OrderEventName) => {
      if (!myId || !pushUnavailable) return;
      const data = { type: 'order', invoiceId: payload.id };
      const num = `#${payload.id}`;

      if (event === 'invoice:created' && role === 'NEGO') {
        void notifyLocal(`order-${payload.id}`, `Pedido nuevo ${num} 🛎️`, 'Entró un pedido nuevo.', data);
      } else if (event === 'invoice:available' && role === 'DELI') {
        void notifyLocal(
          `order-${payload.id}`,
          'Pedido disponible 🛵',
          `Hay un pedido listo para recoger (${num}).`,
          data,
        );
      } else if (event === 'invoice:updated') {
        const code = (payload.stateType as { code?: string } | null | undefined)?.code;
        if (!code) return;
        const previous = lastState.current.get(payload.id);
        lastState.current.set(payload.id, code);
        // Primera vez que se ve el pedido, o el estado no cambió: nada nuevo.
        if (previous === undefined || previous === code) return;
        // Cancelar es una acción del propio cliente/negocio; no se le avisa de lo que hizo.
        if (role === 'USER' && code !== 'CANC') {
          void notifyLocal(
            `order-${payload.id}-${code}`,
            `Pedido ${num}: ${stateMeta(code).label}`,
            'Abre la app para ver el detalle.',
            data,
          );
        }
      }
    },
    [myId, role, pushUnavailable],
  );
  useOrderEvents(onOrder);
}
