import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

/**
 * ¿Este dispositivo tiene los Google Mobile Services (GMS)?
 *
 * Los Huawei vendidos desde 2019 (Mate 30 en adelante) NO los traen, y la app
 * se publica en la AppGallery — donde justamente esos son los equipos. Sin GMS
 * se caen tres cosas de la app:
 *   1. el sign-in nativo de Google (`lib/google-auth.ts`),
 *   2. `react-native-maps` con `PROVIDER_GOOGLE` → recuadro gris,
 *   3. el token de push de FCM (`lib/push.ts`) → nunca llega una notificación.
 *
 * La sonda real es `GoogleSignin.hasPlayServices()`, que por debajo le
 * pregunta a `GoogleApiAvailability`. No necesita `configure()` ni red, y NO
 * es una heurística por marca: los Huawei viejos (P30 y anteriores) sí traen
 * GMS y en esos todo funciona igual que en cualquier Android.
 *
 * Fuera de Android siempre es `true`: en iOS nada de esto depende de GMS
 * (mapas de Apple, sign-in por Safari) y en web cada componente ya tiene su
 * variante `.web.tsx`.
 */

const NEEDS_PROBE = Platform.OS === 'android';

/** Optimista mientras la sonda corre: la enorme mayoría de Android trae GMS,
 * así que asumir `true` evita que el botón de Google y los mapas parpadeen en
 * el caso común. La sonda arranca al evaluar el bundle (abajo) y en la
 * práctica resuelve antes del primer render — el layout raíz no pinta nada
 * hasta que cargan las fuentes (`app/_layout.tsx`). */
let available = true;
let probed = !NEEDS_PROBE;
let probe: Promise<boolean> | null = null;

const listeners = new Set<() => void>();

/** Snapshot para `useSyncExternalStore` (un booleano: referencia estable). */
export function googleServicesAvailable(): boolean {
  return available;
}

export function subscribeGoogleServices(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Corre la sonda una sola vez por arranque de la app y avisa a los suscritos
 * si el resultado cambia el valor optimista. Idempotente: las llamadas
 * siguientes devuelven el mismo resultado sin volver a preguntarle al SO.
 */
export function probeGoogleServices(): Promise<boolean> {
  if (probed) return Promise.resolve(available);
  if (probe) return probe;

  let pending: Promise<boolean>;
  try {
    pending = GoogleSignin.hasPlayServices({
      // Sin diálogo: esto es una consulta de fondo al arrancar, no el momento
      // de interrumpir al usuario con "actualiza Google Play Services".
      showPlayServicesUpdateDialog: false,
    })
      .then(() => true)
      .catch(() => false);
  } catch {
    // El módulo nativo ni siquiera existe (Expo Go, por ejemplo). Eso no
    // significa que al dispositivo le falten los GMS, así que se queda en el
    // valor optimista en vez de degradar toda la app en desarrollo.
    probed = true;
    return Promise.resolve(available);
  }

  probe = pending.then((ok) => {
    probed = true;
    if (ok !== available) {
      available = ok;
      listeners.forEach((listener) => listener());
    }
    return ok;
  });
  return probe;
}

if (NEEDS_PROBE) void probeGoogleServices();
