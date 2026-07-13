import * as SecureStore from 'expo-secure-store';

const KEY = 'mandalo.session';

export type Session = {
  accessToken: string;
  refreshToken: string;
  accessSessionId?: string;
  /**
   * Cuenta recién creada con Google que aún no completa el registro
   * (elegir rol + datos). Mientras esté en true, la app entra a
   * /auth/complete-registration en vez del home.
   */
  needsOnboarding?: boolean;
  user: {
    id: string;
    fullName: string;
    roleTypeId?: string;
    role?: { id: string; code: string; name: string } | null;
    avatarUrl?: string | null;
    /** false en un DELI recién registrado: cuenta en proceso de habilitación. */
    isActive?: boolean;
    /** Nota del admin para el usuario (por qué no se activa su cuenta, etc.). */
    observations?: string | null;
  };
};

/**
 * Ruta inicial según el rol: ADMIN → panel de administración,
 * NEGO → vista del negocio, DELI → vista del repartidor (que muestra
 * "cuenta en proceso" si aún no lo activan), el resto → home de cliente.
 */
export function homePathFor(
  user?: Session['user'] | null,
): '/admin/dashboard' | '/business/dashboard' | '/delivery' | '/home' {
  switch (user?.role?.code) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'NEGO':
      return '/business/dashboard';
    case 'DELI':
      return '/delivery';
    default:
      return '/home';
  }
}

let current: Session | null = null;

// Suscriptores de la sesión (useSession). Con React Compiler los componentes
// NO pueden leer getSession() suelto en el render (JSX memoizado viejo, ver
// regla en NOTAS §23): deben usar el hook, que re-renderiza al cambiar.
const listeners = new Set<() => void>();

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

/** Suscripción a cambios de sesión (para useSyncExternalStore). */
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function setSession(s: Session): Promise<void> {
  current = s;
  emitChange();
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(s));
  } catch {
    // ignore (p. ej. web)
  }
}

export async function loadSession(): Promise<Session | null> {
  if (current) return current;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    current = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    current = null;
  }
  if (current) emitChange();
  return current;
}

/** Acceso síncrono a la sesión en memoria (para el interceptor). */
export function getSession(): Session | null {
  return current;
}

export async function clearSession(): Promise<void> {
  current = null;
  emitChange();
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}
