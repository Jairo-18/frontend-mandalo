import { clearSession, loadSession } from '@/lib/session';
import { authService } from '@/services/auth';

/**
 * Cierra la sesión contra el backend (si hay una sesión de acceso activa) y
 * limpia la sesión local pase lo que pase. El interceptor HTTP muestra el
 * mensaje del backend ("Sesión cerrada exitosamente" o el error).
 */
export async function signOutEverywhere(): Promise<void> {
  try {
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
    await clearSession();
  }
}
