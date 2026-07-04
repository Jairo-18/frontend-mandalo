import * as SecureStore from 'expo-secure-store';

const KEY = 'mandalo.session';

export type Session = {
  accessToken: string;
  refreshToken: string;
  accessSessionId?: string;
  user: { id: string; fullName: string; roleTypeId?: string };
};

let current: Session | null = null;

export async function setSession(s: Session): Promise<void> {
  current = s;
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
  return current;
}

/** Acceso síncrono a la sesión en memoria (para el interceptor). */
export function getSession(): Session | null {
  return current;
}

export async function clearSession(): Promise<void> {
  current = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}
