import { useCallback, useEffect, useState } from 'react';

import {
  fetchDeliveryEstimates,
  resetSharedCoords,
  sharedCoords,
} from '@/lib/delivery-estimates-store';
import { DeviceCoords } from '@/lib/location';
import { useUserAddresses } from '@/hooks/use-user-data';
import { DeliveryEstimate } from '@/services/explore';

/**
 * Cotización de domicilio (distancia, tarifa, ETA) hacia los negocios que se
 * van mostrando en el explorar — estilo Rappi. El GPS y el caché por negocio
 * viven en `lib/delivery-estimates-store.ts`, COMPARTIDOS entre todas las
 * pantallas (home, tienda...): este hook es solo el puente a React.
 *
 * Se cotiza hacia la dirección "enviar a" (la principal), la misma que usa
 * el checkout para cobrar — antes era siempre el GPS y, si el cliente estaba
 * lejos de su casa, la tienda mostraba un domicilio distinto al del pedido.
 * Sin dirección guardada (invitado) cae al GPS.
 */
export function useDeliveryEstimates(
  organizationalIds: number[],
): Record<number, DeliveryEstimate> {
  const [estimates, setEstimates] = useState<Record<number, DeliveryEstimate>>({});
  const { defaultAddress, loading: loadingAddress } = useUserAddresses();
  // Primitivos en las deps (un objeto nuevo por render relanzaría el efecto).
  const lat = defaultAddress?.latitude ?? null;
  const lng = defaultAddress?.longitude ?? null;

  // Clave estable por contenido (no por identidad del array) para no
  // relanzar el efecto en cada render si el caller no memoiza la lista.
  const idsKey = organizationalIds.join(',');

  useEffect(() => {
    // Espera a saber si hay dirección (si no, cotizaría con el GPS y luego
    // cambiaría el valor en pantalla).
    if (!idsKey || loadingAddress) return;
    let alive = true;
    const near = lat != null && lng != null ? { latitude: lat, longitude: lng } : null;
    fetchDeliveryEstimates(idsKey.split(',').map(Number), near).then((data) => {
      // Reemplaza (no mezcla): al cambiar de dirección no quedan valores viejos.
      if (alive) setEstimates(data);
    });
    return () => {
      alive = false;
    };
  }, [idsKey, loadingAddress, lat, lng]);

  return estimates;
}

/**
 * GPS silencioso como respaldo del filtro "cerca de mí" cuando no hay
 * dirección guardada (invitado, o usuario logueado que aún no eligió una) —
 * mismo fix de GPS COMPARTIDO que usan las cotizaciones de domicilio
 * (`lib/delivery-estimates-store.ts`), no pide el permiso dos veces.
 *
 * `resolved` distingue "todavía no sabemos" (sigue en vuelo) de "ya se pidió
 * y no hay coords" (permiso negado o sin fix) — sin esto el caller no puede
 * diferenciar cuándo mostrar el aviso de "activa tu ubicación" sin que
 * parpadee antes de que el intento termine. `retry` descarta el fix cacheado
 * y reintenta (para el botón de ese aviso, por si el usuario acaba de
 * conceder el permiso).
 */
export function useNearGpsFallback(enabled: boolean): {
  coords: DeviceCoords | null;
  resolved: boolean;
  retry: () => void;
} {
  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  const [resolved, setResolved] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setResolved(false);
    sharedCoords().then((c) => {
      if (!alive) return;
      setCoords(c);
      setResolved(true);
    });
    return () => {
      alive = false;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    resetSharedCoords();
    setAttempt((n) => n + 1);
  }, []);

  return { coords, resolved, retry };
}
