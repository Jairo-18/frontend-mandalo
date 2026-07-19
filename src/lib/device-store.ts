import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Almacenamiento clave-valor persistente por plataforma:
 * - Nativo (Android/iOS): SecureStore (encriptado por el SO).
 * - Web: localStorage (SecureStore no existe en el navegador). Es el
 *   estándar de las SPAs para tokens de sesión; NO guardar acá secretos
 *   de larga vida tipo contraseñas — "Recordar mis datos" queda apagado
 *   en web a propósito (credentials.ts sigue directo con SecureStore).
 *
 * Todos los fallos son silenciosos: sin almacenamiento la app funciona
 * igual, solo no persiste entre recargas/arranques.
 */

export async function deviceStoreSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore
  }
}

export async function deviceStoreGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function deviceStoreDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}
