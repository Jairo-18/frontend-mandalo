import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { http } from '@/lib/http';
import { getSession } from '@/lib/session';
import { useSession } from '@/hooks/use-session';

/**
 * Notificaciones push (Expo Notifications + FCM). El backend manda los push
 * al servicio de Expo con el ExponentPushToken que registra este módulo.
 *
 * ⚠️ En Android el token SOLO sale si el build trae un `google-services.json`
 * REAL (proyecto de Firebase). Con el placeholder del repo, `register` falla
 * en silencio y la app sigue normal (sin push). Ver tarea en NOTAS.
 */

// La notificación también se muestra con la app ABIERTA (banner discreto).
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

/** Último token registrado en el backend (para retirarlo en el logout). */
let registeredToken: string | null = null;
/** Evita registrar dos veces en la misma corrida de la app. */
let registering = false;

/** Última respuesta de notificación ya navegada (no repetir en cold start). */
let handledResponseId: string | null = null;

async function ensurePermissionsAndChannel(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Canal que usa el backend (channelId: 'orders').
    // Sin `sound`: usa el sonido de notificación del sistema ('default' acá
    // significaría un archivo custom del build y expo-notifications se queja).
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Pedidos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5A3C',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Pide permiso, obtiene el ExponentPushToken y lo registra en el backend.
 * Se llama cuando hay sesión activa; todos los fallos son silenciosos (sin
 * Firebase configurado, emulador sin Play Services, permiso negado…).
 */
export async function registerPushToken(): Promise<void> {
  if (registering || registeredToken) return;
  registering = true;
  try {
    const granted = await ensurePermissionsAndChannel();
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
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
  } catch (error) {
    if (__DEV__) {
      console.log('[push] registro fallido (¿Firebase sin configurar?):', error);
    }
  } finally {
    registering = false;
  }
}

/** Retira el token del backend (logout del dispositivo). Silencioso. */
export async function unregisterPushToken(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
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
    | { type?: string; invoiceId?: number }
    | undefined;
  if (data?.type !== 'order' || !data.invoiceId) return;

  const role = getSession()?.user.role?.code;
  try {
    if (role === 'NEGO') router.push('/business/orders');
    else if (role === 'DELI') router.push('/delivery');
    else if (role === 'ADMIN') router.push('/admin/orders');
    else router.push(`/orders/${data.invoiceId}`);
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

  useEffect(() => {
    if (!loggedIn) return;
    void registerPushToken();

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
