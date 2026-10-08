import * as Notifications from 'expo-notifications';
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useSession } from '@/hooks/use-session';
import {
  ChatSocketEvent,
  OrderEvent,
  OrderEventName,
  useChatMessages,
  useOrderEvents,
} from '@/lib/orders-socket';
import { stateMeta } from '@/lib/order-status';
import { ensurePermissionsAndChannel, usePushUnavailable } from '@/lib/push';

/**
 * Sonido + aviso con la app ABIERTA, para lo que el push no cubre.
 *
 * - **Chat**: el backend manda el push SOLO si el destinatario no está
 *   conectado al socket (`chat.service.ts`). Con la app abierta el mensaje
 *   llegaba mudo, sin sonido ni aviso. Acá se dispara una notificación LOCAL
 *   (la reproduce el handler de `lib/push.ts`, con el sonido del sistema)
 *   salvo que el usuario ya esté mirando ese mismo hilo.
 * - **Pedidos en un teléfono sin push (Huawei sin GMS)**: ahí no hay FCM, así
 *   que los eventos del socket son lo único que llega — se avisan igual con
 *   notificación local. Con push disponible NO se duplica: el backend ya lo
 *   manda siempre y suena por el handler de primer plano.
 *
 * Montado UNA vez en el layout raíz. En web es un no-op (ver `.web.ts`).
 */

const CHANNEL_ID = 'orders-v2';

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

  // Sin GMS no hay push y `registerPushToken` ni siquiera pidió el permiso de
  // notificaciones: se pide acá (y se crea el canal) para poder avisar local.
  useEffect(() => {
    if (!myId || !pushUnavailable) return;
    void ensurePermissionsAndChannel();
  }, [myId, pushUnavailable]);

  const onChat = useCallback(
    (event: ChatSocketEvent) => {
      if (!myId || event.message.senderUserId === myId) return;
      // Ya está mirando este hilo: el mensaje aparece solo, sin aviso.
      if (pathname === `/chat/${event.invoiceId}`) return;
      void notifyLocal(
        `chat-${event.invoiceId}`,
        '💬 Nuevo mensaje',
        event.message.body.length > 120
          ? `${event.message.body.slice(0, 117)}…`
          : event.message.body,
        { type: 'chat', invoiceId: event.invoiceId },
      );
    },
    [myId, pathname],
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
            `order-${payload.id}`,
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
