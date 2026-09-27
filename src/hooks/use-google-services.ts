import { useSyncExternalStore } from 'react';

import {
  googleServicesAvailable,
  subscribeGoogleServices,
} from '@/lib/google-services';

/**
 * `true` si el dispositivo tiene Google Mobile Services (ver
 * `lib/google-services.ts`). REACTIVO: la sonda es asíncrona, así que el
 * valor puede pasar de `true` (optimista) a `false` en un equipo sin GMS y
 * las pantallas tienen que re-renderizar solas.
 *
 * El snapshot ES el booleano (no una versión + getter suelto), como exige
 * React Compiler — misma regla que `useSession` (NOTAS §23).
 */
export function useGoogleServices(): boolean {
  return useSyncExternalStore(subscribeGoogleServices, googleServicesAvailable);
}
