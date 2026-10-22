import { DeviceCoords, getDeviceCoordsSilently } from '@/lib/location';
import { DeliveryEstimate, exploreService } from '@/services/explore';

/** Mismo TTL que el `CacheInterceptor` de `/explore/*` en el backend: no
 * tiene sentido que el front guarde el dato más fresco de lo que el propio
 * backend garantiza, y el recargo nocturno/de clima puede cambiar de un
 * momento a otro. */
const TTL_MS = 2 * 60_000;

let coordsPromise: Promise<DeviceCoords | null> | null = null;

/**
 * Un solo fix de GPS por sesión de la app, compartido entre TODAS las
 * pantallas que cotizan domicilio (antes cada montada de `useDeliveryEstimates`
 * pedía su propio fix — home Y la tienda pedían el GPS por separado al
 * navegar de una a la otra). Exportada para que el home también la use como
 * respaldo del filtro de cercanía cuando no hay dirección guardada (invitado).
 */
export function sharedCoords(): Promise<DeviceCoords | null> {
  if (!coordsPromise) coordsPromise = getDeviceCoordsSilently();
  return coordsPromise;
}

/**
 * Descarta el fix cacheado para forzar un reintento (botón "Activar
 * ubicación" del home cuando el primer intento volvió sin coords: el usuario
 * pudo haber aceptado el permiso recién, en el diálogo nativo o en Ajustes).
 */
export function resetSharedCoords(): void {
  coordsPromise = null;
}

type Entry = { data: DeliveryEstimate; expiresAt: number };
/** Clave `lat,lng:organizationalId` (2 decimales, igual que la query al
 * backend): cambiar la dirección "enviar a" no reutiliza cotizaciones de otra. */
const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<void>>();

const coordsKey = (c: DeviceCoords) => `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;

/**
 * Cotizaciones de domicilio cacheadas por negocio y COMPARTIDAS entre todas
 * las pantallas (store de módulo, no por-instancia del hook): antes el home
 * y la pantalla de la tienda repetían la misma consulta para el mismo
 * negocio a los pocos segundos de navegar de uno a otro.
 */
export async function fetchDeliveryEstimates(
  organizationalIds: number[],
  /** Dirección "enviar a" del cliente; sin ella, el GPS del teléfono. */
  near?: DeviceCoords | null,
): Promise<Record<number, DeliveryEstimate>> {
  const coords = near ?? (await sharedCoords());
  if (!coords) return {};
  const prefix = coordsKey(coords);
  const key = (id: number) => `${prefix}:${id}`;

  const now = Date.now();
  const toFetch = organizationalIds.filter((id) => {
    const entry = cache.get(key(id));
    return (!entry || entry.expiresAt <= now) && !pending.has(key(id));
  });

  if (toFetch.length > 0) {
    const fetchPromise = exploreService
      .deliveryEstimates(coords, toFetch)
      .then(({ data }) => {
        const expiresAt = Date.now() + TTL_MS;
        for (const item of data) {
          cache.set(key(item.organizationalId), { data: item, expiresAt });
        }
      })
      .catch(() => {
        // Sin cotización no pasa nada: el caller oculta el dato si no llega.
      })
      .finally(() => {
        toFetch.forEach((id) => pending.delete(key(id)));
      });
    toFetch.forEach((id) => pending.set(key(id), fetchPromise));
  }

  // Espera cualquier fetch en curso para los ids pedidos (propio o disparado
  // por otro caller que llegó primero al mismo negocio).
  await Promise.all(
    organizationalIds.map((id) => pending.get(key(id))).filter((p) => p != null),
  );

  const result: Record<number, DeliveryEstimate> = {};
  for (const id of organizationalIds) {
    const entry = cache.get(key(id));
    if (entry) result[id] = entry.data;
  }
  return result;
}
