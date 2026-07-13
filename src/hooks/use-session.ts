import { useSyncExternalStore } from 'react';

import { getSession, Session, subscribeSession } from '@/lib/session';

/**
 * Sesión REACTIVA: re-renderiza cuando cambia (guardar perfil, vincular
 * Google, refresh de tokens). Úsalo en todo componente que muestre datos de
 * la sesión — leer `getSession()` suelto en el render deja JSX memoizado
 * viejo con React Compiler (regla de NOTAS §23). El snapshot ES el objeto de
 * sesión (referencia estable entre cambios), como exige el compilador.
 */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSession);
}
