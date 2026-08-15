import { useEffect, useState } from 'react';

import { fetchDeliveryEstimates, sharedCoords } from '@/lib/delivery-estimates-store';
import { DeviceCoords } from '@/lib/location';
import { DeliveryEstimate } from '@/services/explore';

/**
 * Cotización de domicilio (distancia, tarifa, ETA) hacia los negocios que se
 * van mostrando en el explorar — estilo Rappi. El GPS y el caché por negocio
 * viven en `lib/delivery-estimates-store.ts`, COMPARTIDOS entre todas las
 * pantallas (home, tienda...): este hook es solo el puente a React.
 */
export function useDeliveryEstimates(
  organizationalIds: number[],
): Record<number, DeliveryEstimate> {
  const [estimates, setEstimates] = useState<Record<number, DeliveryEstimate>>({});

  // Clave estable por contenido (no por identidad del array) para no
  // relanzar el efecto en cada render si el caller no memoiza la lista.
  const idsKey = organizationalIds.join(',');

  useEffect(() => {
    if (!idsKey) return;
    let alive = true;
    fetchDeliveryEstimates(idsKey.split(',').map(Number)).then((data) => {
      if (alive) setEstimates((prev) => ({ ...prev, ...data }));
    });
    return () => {
      alive = false;
    };
  }, [idsKey]);

  return estimates;
}

/**
 * GPS silencioso como respaldo del filtro "cerca de mí" cuando no hay
 * dirección guardada (invitado, o usuario logueado que aún no eligió una) —
 * mismo fix de GPS COMPARTIDO que usan las cotizaciones de domicilio
 * (`lib/delivery-estimates-store.ts`), no pide el permiso dos veces.
 */
export function useNearGpsFallback(enabled: boolean): DeviceCoords | null {
  const [coords, setCoords] = useState<DeviceCoords | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    sharedCoords().then((c) => {
      if (alive) setCoords(c);
    });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return coords;
}
