import { router } from 'expo-router';

import { resetUnreadChats } from '@/hooks/use-unread-chats';
import { stopDeliveryTracking } from '@/lib/delivery-tracker';
import { disconnectOrdersSocket } from '@/lib/orders-socket';
import { unregisterPushToken } from '@/lib/push';
import { clearSession, loadSession } from '@/lib/session';
import { clearUserData } from '@/lib/user-data';
import { authService } from '@/services/auth';

// ---- Estado global "cerrando sesión" (para el overlay del layout raíz) ----
// Al limpiar la sesión, todas las pantallas montadas se re-renderizan de golpe
// con los datos vacíos y se ve feo. El overlay tapa ese flash hasta que el
// login está en pantalla.

let signingOut = false;
const listeners = new Set<() => void>();

function setSigningOut(next: boolean): void {
  if (next === signingOut) return;
  signingOut = next;
  listeners.forEach((listener) => listener());
}

/** Suscripción para useSyncExternalStore (SigningOutOverlay). */
export function subscribeSigningOut(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Snapshot: ES el dato (regla React Compiler de NOTAS §23). */
export function isSigningOut(): boolean {
  return signingOut;
}

/**
 * Cierra la sesión contra el backend (si hay una sesión de acceso activa),
 * limpia la sesión local pase lo que pase y navega al login. Mientras tanto
 * el overlay "Cerrando sesión…" cubre la app (el flash de datos vaciándose).
 * El interceptor HTTP muestra el mensaje del backend.
 */
export async function signOutEverywhere(): Promise<void> {
  setSigningOut(true);
  try {
    // Antes de tumbar la sesión: este dispositivo deja de recibir push.
    await unregisterPushToken();
    const s = await loadSession();
    if (s?.accessSessionId) {
      await authService.signOut({
        userId: s.user.id,
        accessToken: s.accessToken,
        accessSessionId: s.accessSessionId,
      });
    }
  } catch {
    // El interceptor ya mostró el error; igual se limpia la sesión local.
  } finally {
    // Un DELI que cierra sesión con una entrega activa deja de transmitir.
    await stopDeliveryTracking().catch(() => {});
    disconnectOrdersSocket();
    resetUnreadChats();
    clearUserData();
    await clearSession();
    try {
      router.replace('/auth/login');
    } catch {
      // Router sin montar (arranque muy temprano): el guard del layout redirige.
    }
    // El overlay se levanta cuando el login ya está pintado (evita el flash).
    setTimeout(() => setSigningOut(false), 450);
  }
}
