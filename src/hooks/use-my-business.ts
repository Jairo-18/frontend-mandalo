import { useSyncExternalStore } from 'react';

import { AdminBusiness } from '@/services/admin-businesses';
import { getMyBusiness, subscribeMyBusiness } from '@/lib/my-business';

/**
 * Negocio propio REACTIVO (rol NEGO): re-renderiza cuando cambia (al guardar
 * "Editar mi negocio"). Úsalo en la cabecera del drawer y en la pantalla
 * "Mi negocio" para que ambas reflejen lo último sin re-fetch manual.
 */
export function useMyBusiness(): AdminBusiness | null {
  return useSyncExternalStore(subscribeMyBusiness, getMyBusiness);
}
