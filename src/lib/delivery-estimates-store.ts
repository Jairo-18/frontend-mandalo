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
 * navegar de una a la otra).
 */
function sharedCoords(): Promise<DeviceCoords | null> {
  if (!coordsPromise) coordsPromise = getDeviceCoordsSilently();
  return coordsPromise;
}

type Entry = { data: DeliveryEstimate; expiresAt: number };
const cache = new Map<number, Entry>();
const pending = new Map<number, Promise<void>>();

/**
 * Cotizaciones de domicilio cacheadas por negocio y COMPARTIDAS entre todas
 * las pantallas (store de módulo, no por-instancia del hook): antes el home
 * y la pantalla de la tienda repetían la misma consulta para el mismo
 * negocio a los pocos segundos de navegar de uno a otro.
 */
export async function fetchDeliveryEstimates(
  organizationalIds: number[],
): Promise<Record<number, DeliveryEstimate>> {
  const coords = await sharedCoords();
  if (!coords) return {};

  const now = Date.now();
  const toFetch = organizationalIds.filter((id) => {
    const entry = cache.get(id);
    return (!entry || entry.expiresAt <= now) && !pending.has(id);
  });

  if (toFetch.length > 0) {
    const fetchPromise = exploreService
      .deliveryEstimates(coords, toFetch)
      .then(({ data }) => {
        const expiresAt = Date.now() + TTL_MS;
        for (const item of data) {
          cache.set(item.organizationalId, { data: item, expiresAt });
        }
      })
      .catch(() => {
        // Sin cotización no pasa nada: el caller oculta el dato si no llega.
      })
      .finally(() => {
        toFetch.forEach((id) => pending.delete(id));
      });
    toFetch.forEach((id) => pending.set(id, fetchPromise));
  }

  // Espera cualquier fetch en curso para los ids pedidos (propio o disparado
  // por otro caller que llegó primero al mismo negocio).
  await Promise.all(
    organizationalIds.map((id) => pending.get(id)).filter((p) => p != null),
  );

  const result: Record<number, DeliveryEstimate> = {};
  for (const id of organizationalIds) {
    const entry = cache.get(id);
    if (entry) result[id] = entry.data;
  }
  return result;
}
