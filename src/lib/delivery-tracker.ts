import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { emitDeliveryPosition } from '@/lib/orders-socket';

/**
 * En web no hay tareas en background (expo-task-manager es nativo): el
 * tracking cae al watcher de primer plano, que en el navegador usa la
 * geolocalización estándar y funciona mientras la pestaña esté abierta.
 */
const BACKGROUND_SUPPORTED = Platform.OS !== 'web';

/**
 * Tracking del repartidor con pedidos EN RUTA: transmite su GPS por el socket
 * (cada ~8 s o ~25 m) para el mapa en vivo del cliente.
 *
 * Ahora sigue funcionando con la PANTALLA BLOQUEADA: usa
 * `startLocationUpdatesAsync` + un foreground service de Android
 * (notificación persistente "entrega en curso") que mantiene vivos el GPS,
 * el JS y el socket. Si el repartidor niega el permiso de background
 * ("Permitir todo el tiempo"), cae al watcher de primer plano de siempre.
 */

const TASK_NAME = 'mandalo-delivery-tracking';

/**
 * Pedidos que la tarea reporta. Vive a nivel de módulo: la tarea corre en el
 * MISMO contexto JS (el foreground service mantiene el proceso vivo), así que
 * comparte el socket y este estado con la app.
 */
let activeInvoiceIds: number[] = [];

// La tarea debe definirse al cargar el módulo (antes de que el SO la dispare)
// — este archivo se importa en el layout raíz.
if (BACKGROUND_SUPPORTED) {
  TaskManager.defineTask(TASK_NAME, ({ data, error }): Promise<void> => {
    if (!error && data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      const last = locations[locations.length - 1];
      if (last) {
        for (const id of activeInvoiceIds) {
          emitDeliveryPosition(id, {
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
          });
        }
      }
    }
    return Promise.resolve();
  });
}

/** Arranca el tracking con foreground service; false si faltan permisos. */
async function startBackgroundTracking(): Promise<boolean> {
  if (!BACKGROUND_SUPPORTED) return false;
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) return false;
    // Android 10+: "Permitir todo el tiempo" (abre la pantalla de ajustes).
    const background = await Location.requestBackgroundPermissionsAsync();
    if (!background.granted) return false;

    if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) return true;

    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 8000,
      distanceInterval: 25,
      // Notificación persistente del servicio (obligatoria en Android).
      foregroundService: {
        notificationTitle: 'Mándalo — entrega en curso',
        notificationBody:
          'Compartiendo tu ubicación con el cliente mientras llevas el pedido.',
        notificationColor: '#FF5A3C',
      },
      // iOS
      activityType: Location.ActivityType.AutomotiveNavigation,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
    });
    return true;
  } catch {
    return false;
  }
}

/** Detiene el servicio si está corriendo (fin de las entregas o logout). */
export async function stopDeliveryTracking(): Promise<void> {
  activeInvoiceIds = [];
  if (!BACKGROUND_SUPPORTED) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
  } catch {
    // La tarea no existe todavía (primer arranque): nada que detener.
  }
}

export function useDeliveryPositionBroadcast(invoiceIds: number[]): void {
  // Primitivo estable en las deps: un array nuevo por render reiniciaría el
  // watcher del GPS en cada refresco de la lista.
  const key = [...invoiceIds].sort((a, b) => a - b).join(',');

  useEffect(() => {
    activeInvoiceIds = key ? key.split(',').map(Number) : [];

    // Sin pedidos en ruta: apagar el servicio (y su notificación).
    if (!key) {
      void stopDeliveryTracking();
      return;
    }

    let subscription: Location.LocationSubscription | null = null;
    let alive = true;

    (async () => {
      const backgroundStarted = await startBackgroundTracking();
      if (backgroundStarted || !alive) return;

      // Fallback sin permiso de background: solo primer plano (como antes).
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !alive) return;
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 8000,
          distanceInterval: 25,
        },
        (position) => {
          for (const id of activeInvoiceIds) {
            emitDeliveryPosition(id, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        },
      );
    })();

    return () => {
      alive = false;
      subscription?.remove();
    };
  }, [key]);
}
