import { useEffect, useState } from 'react';

import { fetchDeliveryEstimates } from '@/lib/delivery-estimates-store';
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
