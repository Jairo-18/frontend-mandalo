import { AdminBusiness } from '@/services/admin-businesses';
import { businessService } from '@/services/business';

/**
 * Store REACTIVO del negocio del usuario NEGO autenticado. Lo comparten la
 * cabecera del drawer y la pantalla "Mi negocio" para que, al guardar cambios
 * (nombre comercial, logo, etc.), ambos se refresquen a la vez. Mismo patrón
 * que la sesión (`lib/session.ts`): el snapshot ES el objeto (referencia
 * estable entre cambios), como exige React Compiler (regla de NOTAS §23).
 */

let current: AdminBusiness | null = null;

const listeners = new Set<() => void>();

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

/** Suscripción a cambios (para useSyncExternalStore). */
export function subscribeMyBusiness(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Acceso síncrono al negocio en memoria (snapshot para el hook). */
export function getMyBusiness(): AdminBusiness | null {
  return current;
}

/** Fija el negocio en memoria y notifica a los suscriptores. */
export function setMyBusiness(business: AdminBusiness | null): void {
  current = business;
  emitChange();
}

/**
 * Trae el negocio propio del backend (`/organizational/mine`) y actualiza el
 * store. Si falla, el interceptor HTTP ya mostró el error y se conserva lo que
 * hubiera. Devuelve el negocio (o null si falló y no había nada).
 */
export async function refreshMyBusiness(): Promise<AdminBusiness | null> {
  try {
    const res = await businessService.getMine();
    setMyBusiness(res.data);
  } catch {
    // El interceptor HTTP ya avisó (p. ej. cuenta sin negocio).
  }
  return current;
}
