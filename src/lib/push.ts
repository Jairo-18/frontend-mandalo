import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { Linking, Platform } from 'react-native';

import { http } from '@/lib/http';
import { probeGoogleServices } from '@/lib/google-services';
import { getSession } from '@/lib/session';
import { useSession } from '@/hooks/use-session';
import { getAppColors } from '@/lib/app-colors';

// Módulo nativo local (raíz del repo, `modules/`), fuera del alias `@/`.
import { hasNotifySound, playNotifySound } from '../../modules/notify-sound';

/**
 * Notificaciones push (Expo Notifications + FCM). El backend manda los push
 * al servicio de Expo con el ExponentPushToken que registra este módulo.
 *
 * ⚠️ En Android el token SOLO sale si el build trae un `google-services.json`
 * REAL (proyecto de Firebase). Con el placeholder del repo, `register` falla
 * en silencio y la app sigue normal (sin push). Ver tarea en NOTAS.
 *
 * ⚠️ FCM necesita Google Mobile Services. En un Android SIN GMS (los Huawei
 * de la AppGallery) NO hay push posible: no es un fallo que se pueda
 * reintentar ni degradar a notificación local — el token simplemente no
 * existe. Ahí la app marca `pushUnavailable` para que el negocio y el
 * repartidor sepan que tienen que mantenerla abierta (con la app en primer
 * plano los eventos siguen llegando por el socket, ver `orders-socket.ts`).
 */

// En web no hay push (expo-notifications no soporta el navegador): los
// eventos en vivo llegan igual por el socket con la pestaña abierta.
const PUSH_SUPPORTED = Platform.OS !== 'web';

/** Canal de Android que usan el backend y los avisos locales. */
export const CHANNEL_ID = 'orders-v2';

/** Hilo de chat abierto en pantalla (lo fija `in-app-alerts.ts`). */
let activeChatInvoiceId: number | null = null;

export function setActiveChatThread(invoiceId: number | null): void {
  activeChatInvoiceId = invoiceId;
}

// La notificación también se muestra con la app ABIERTA (banner + sonido),
// salvo un mensaje del chat que el usuario ya está mirando.
//
// Android con el módulo `notify-sound` (builds nuevos): la notificación se
// muestra SIN sonido y el sonido lo pone el módulo. Android 16+ quita el sonido
// a notificaciones seguidas de la misma app ("enfriamiento") y los avisos de
// un pedido llegan justo así; el módulo no pasa por ese filtro y, igual que el
// sistema, NO suena en vibración, silencio ni "No molestar". En iOS (sin ese
// filtro) y en builds viejos sin el módulo, suena la notificación normal.
if (PUSH_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: (notification) => {
      const data = notification.request.content.data as
        { type?: string; invoiceId?: number } | undefined;
      const silent =
        data?.type === 'chat' &&
        activeChatInvoiceId != null &&
        data.invoiceId === activeChatInvoiceId;
      const ownSound = !silent && hasNotifySound;
      if (ownSound) void playNotifySound();
      return Promise.resolve({
        shouldShowBanner: !silent,
        shouldShowList: !silent,
        shouldPlaySound: !silent && !ownSound,
        shouldSetBadge: false,
      });
    },
  });
}

/** Último token registrado en el backend (para retirarlo en el logout). */
let registeredToken: string | null = null;
/**
 * Usuario para el que se registró. Si cambia (otra cuenta en el mismo
 * teléfono) se vuelve a registrar: antes bastaba con haberlo hecho una vez en
 * la corrida de la app, y si el backend había perdido la fila (cuenta borrada
 * y restaurada, token limpiado por DeviceNotRegistered) el teléfono se
 * quedaba sin push hasta reinstalar.
 */
let registeredFor: string | null = null;
/** Evita registrar dos veces a la vez. */
let registering = false;

/** Última respuesta de notificación ya navegada (no repetir en cold start). */
let handledResponseId: string | null = null;

/**
 * El dispositivo NO puede recibir push nunca (Android sin GMS). Distinto de
 * "todavía no se registró" o "el usuario negó el permiso": esto no se
 * reintenta ni se arregla desde Ajustes.
 */
let pushUnavailable = false;
const availabilityListeners = new Set<() => void>();

function markPushUnavailable(): void {
  if (pushUnavailable) return;
  pushUnavailable = true;
  availabilityListeners.forEach((listener) => listener());
}

/** Snapshot para `useSyncExternalStore` (un booleano: referencia estable). */
function getPushUnavailable(): boolean {
  return pushUnavailable;
}

function subscribePushAvailability(listener: () => void): () => void {
  availabilityListeners.add(listener);
  return () => {
    availabilityListeners.delete(listener);
  };
}

/**
 * `true` cuando este dispositivo no puede recibir push del todo. REACTIVO:
 * se resuelve al registrar el token (después del login), así que la pantalla
 * que lo muestre tiene que re-renderizar sola.
 */
export function usePushUnavailable(): boolean {
  return useSyncExternalStore(subscribePushAvailability, getPushUnavailable);
}

/**
 * Crea (o refresca) el canal de Android. Debe existir ANTES de pedir el
 * permiso: en Android 13+ el diálogo del sistema no aparece sin un canal.
 */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Canal que usa el backend (channelId: 'orders-v2').
  // Sin `sound`: Android le pone el sonido de notificación PREDETERMINADO del
  // teléfono (el que el usuario eligió en Ajustes), o sea el sonido
  // característico de cada dispositivo. 'default' acá significaría un archivo
  // custom del build y deja el canal MUDO.
  // ⚠️ Es 'orders-v2' porque el canal 'orders' se llegó a crear MUDO en los
  // teléfonos que instalaron el build con `sound: 'default'` — los canales
  // de Android son inmutables (ni borrarlos sirve: resucitan con la config
  // vieja), así que la única salida es estrenar id de canal.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Pedidos y mensajes',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: getAppColors().primaryColor,
  });
}

// ---------- estado del permiso (lo muestra `NotificationGate`) ----------

/**
 * - `checking`: todavía no se consultó.
 * - `ok`: permiso concedido y con sonido.
 * - `ask`: se puede mostrar el diálogo del sistema.
 * - `settings`: negado sin posibilidad de volver a preguntar → Ajustes.
 * - `muted`: hay permiso pero el usuario (o la capa del fabricante, p. ej.
 *   MIUI/EMUI) dejó el canal sin sonido → Ajustes del canal.
 */
export type NotifyStatus = 'checking' | 'ok' | 'ask' | 'settings' | 'muted';

let notifyStatus: NotifyStatus = 'checking';
/** Ya se mostró el diálogo del sistema en esta corrida de la app. */
let askedOnce = false;
const statusListeners = new Set<() => void>();

function setNotifyStatus(next: NotifyStatus): void {
  if (next === notifyStatus) return;
  notifyStatus = next;
  statusListeners.forEach((listener) => listener());
}

function subscribeNotifyStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function useNotifyStatus(): NotifyStatus {
  return useSyncExternalStore(subscribeNotifyStatus, () => notifyStatus);
}

/** ¿El aviso va a sonar? (canal de Android / ajuste "Sonidos" de iOS). */
async function hasSound(
  permissions: Notifications.NotificationPermissionsStatus,
): Promise<boolean> {
  if (Platform.OS === 'ios') return permissions.ios?.allowsSound !== false;
  if (Platform.OS !== 'android') return true;
  const channel = await Notifications.getNotificationChannelAsync(CHANNEL_ID);
  if (!channel) return true;
  return (
    channel.sound != null &&
    channel.importance >= Notifications.AndroidImportance.DEFAULT
  );
}

/** Vuelve a leer el permiso del sistema (al iniciar sesión y al volver a la app). */
export async function refreshNotifyStatus(): Promise<NotifyStatus> {
  if (!PUSH_SUPPORTED) {
    setNotifyStatus('ok');
    return 'ok';
  }
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    let next: NotifyStatus;
    if (current.granted) next = (await hasSound(current)) ? 'ok' : 'muted';
    // Android < 13 no tiene diálogo: si ya se intentó y sigue negado, a Ajustes.
    else if (current.canAskAgain && !askedOnce) next = 'ask';
    else next = 'settings';
    setNotifyStatus(next);
    return next;
  } catch {
    // Sin módulo nativo (no debería pasar en un build real): no bloquear.
    setNotifyStatus('ok');
    return 'ok';
  }
}

/** Abre los ajustes de notificaciones de la app (o del canal, si está mudo). */
async function openNotificationSettings(channel: boolean): Promise<void> {
  if (Platform.OS === 'android') {
    const pkg = Constants.expoConfig?.android?.package ?? 'com.mandalo.app';
    const extras = [{ key: 'android.provider.extra.APP_PACKAGE', value: pkg }];
    try {
      await Linking.sendIntent(
        channel
          ? 'android.settings.CHANNEL_NOTIFICATION_SETTINGS'
          : 'android.settings.APP_NOTIFICATION_SETTINGS',
        channel
          ? [...extras, { key: 'android.provider.extra.CHANNEL_ID', value: CHANNEL_ID }]
          : extras,
      );
      return;
    } catch {
      // Capa del fabricante sin esa pantalla: cae a la ficha de la app.
    }
  }
  await Linking.openSettings();
}

/**
 * Acción del botón de `NotificationGate` (siempre desde un toque del usuario):
 * muestra el diálogo del sistema o lleva a Ajustes según el estado.
 */
export async function requestNotifyPermission(): Promise<void> {
  if (notifyStatus === 'ask') {
    askedOnce = true;
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      // El refresh de abajo decide qué sigue.
    }
    await refreshNotifyStatus();
    return;
  }
  await openNotificationSettings(notifyStatus === 'muted');
  // Al volver de Ajustes, `NotificationGate` refresca con el AppState.
}

/**
 * Pide permiso, obtiene el ExponentPushToken y lo registra en el backend.
 * Se llama cuando hay sesión activa; todos los fallos son silenciosos (sin
 * Firebase configurado, emulador sin Play Services, permiso negado…).
 */
export async function registerPushToken(): Promise<void> {
  if (!PUSH_SUPPORTED) return;
  const userId = getSession()?.user.id ?? null;
  if (registering || !userId || (registeredToken && registeredFor === userId)) return;
  registering = true;
  try {
    // Sin GMS no hay FCM y por lo tanto no hay token. El permiso igual se
    // pide (NotificationGate): los avisos locales de `in-app-alerts.ts` sí
    // suenan sin GMS mientras la app esté abierta.
    if (Platform.OS === 'android' && !(await probeGoogleServices())) {
      markPushUnavailable();
      return;
    }

    // El permiso lo pide `NotificationGate`; acá solo se usa si ya está.
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (!token) return;

    await http('/user/me/push-token', {
      method: 'POST',
      body: { token },
      auth: true,
      // Silencioso: activar push no debe toastear errores al usuario.
      toastError: false,
    });
    registeredToken = token;
    registeredFor = userId;
  } catch (error) {
    if (__DEV__) {
      console.log(
        '[push] registro fallido (¿Firebase sin configurar?):',
        error,
      );
    }
  } finally {
    registering = false;
  }
}

/** Retira el token del backend (logout del dispositivo). Silencioso. */
export async function unregisterPushToken(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  registeredFor = null;
  if (!token) return;
  try {
    await http('/user/me/push-token', {
      method: 'DELETE',
      body: { token },
      auth: true,
      toastError: false,
    });
  } catch {
    // Sin red o sesión ya caída: el backend limpiará el token cuando Expo
    // reporte DeviceNotRegistered.
  }
}

/** Navega al lugar correcto según el rol cuando se toca una notificación. */
function navigateFromNotification(
  response: Notifications.NotificationResponse,
): void {
  const id = response.notification.request.identifier;
  if (id === handledResponseId) return;
  handledResponseId = id;

  const data = response.notification.request.content.data as
    { type?: string; invoiceId?: number } | undefined;
  if (!data?.invoiceId) return;

  const role = getSession()?.user.role?.code;
  try {
    if (data.type === 'chat') {
      // Mensaje de chat: directo al hilo del pedido.
      router.push(`/chat/${data.invoiceId}`);
      return;
    }
    if (data.type !== 'order') return;
    if (role === 'NEGO') router.push('/business/orders');
    else if (role === 'DELI') router.push('/delivery');
    else if (role === 'ADMIN' || role === 'SUPERADMIN') router.push('/admin/orders');
    // Con ancla: la lista queda debajo del detalle (atrás vuelve a la lista).
    else router.push(`/orders/${data.invoiceId}`, { withAnchor: true });
  } catch {
    // Router sin montar todavía (cold start muy temprano): el usuario ya
    // quedó dentro de la app igual.
  }
}

/**
 * Hook de arranque (montado UNA vez en el layout raíz): registra el token
 * cuando aparece la sesión y navega al pedido al tocar una notificación
 * (incluida la que abrió la app desde cero).
 */
export function usePushNotifications(): void {
  const session = useSession();
  const loggedIn = !!session;
  const status = useNotifyStatus();
  const granted = status === 'ok' || status === 'muted';

  // El token se registra en cuanto hay sesión Y permiso (puede llegar
  // después: lo concede desde NotificationGate o desde Ajustes).
  const userId = session?.user.id;
  useEffect(() => {
    if (userId && granted && PUSH_SUPPORTED) void registerPushToken();
  }, [userId, granted]);

  useEffect(() => {
    if (!loggedIn || !PUSH_SUPPORTED) return;

    // App abierta desde la notificación (cold start).
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) navigateFromNotification(response);
    });

    const sub = Notifications.addNotificationResponseReceivedListener(
      navigateFromNotification,
    );
    return () => sub.remove();
  }, [loggedIn]);
}
