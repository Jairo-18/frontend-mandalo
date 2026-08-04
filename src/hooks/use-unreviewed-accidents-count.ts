import { useEffect, useState } from 'react';

import { deliveryAccidentService } from '@/services/delivery-accident';

/**
 * Badge del sidebar admin ("Accidentes") — sin socket dedicado para admin
 * (mismo criterio que `/admin/orders`, pull-to-refresh): se carga al montar
 * el drawer y punto, no hace falta tiempo real para un contador de seguridad.
 */
export function useUnreviewedAccidentsCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    deliveryAccidentService
      .unreviewedCount()
      .then(setCount)
      .catch(() => {});
  }, []);

  return count;
}
