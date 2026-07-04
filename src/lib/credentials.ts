import * as SecureStore from 'expo-secure-store';

const KEY = 'mandalo.credentials';

export type SavedCredentials = { email: string; password: string };

/** Guarda las credenciales de forma encriptada (SecureStore). */
export async function saveCredentials(c: SavedCredentials): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(c));
  } catch {
    // no disponible (p. ej. web) → se ignora silenciosamente
  }
}

/** Devuelve las credenciales guardadas, o null si no hay / no se pudo leer. */
export async function loadCredentials(): Promise<SavedCredentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as SavedCredentials) : null;
  } catch {
    return null;
  }
}

/** Borra las credenciales guardadas. */
export async function clearCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}
