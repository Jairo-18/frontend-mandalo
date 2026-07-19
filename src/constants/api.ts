import { Platform } from 'react-native';

/**
 * URL base del backend. Las URLs viven en `.env.local` (gitignored) y acá
 * solo quedan los defaults por si las variables no están:
 *
 * - `EXPO_PUBLIC_DEV_API_URL`  → a qué API pega `expo start` (__DEV__).
 *   En `.env.local` hay dos líneas (backend local / dev desplegado): se
 *   comenta una u otra para cambiar de backend. Default: backend local
 *   (Android emulador ve el localhost del PC como 10.0.2.2).
 * - `EXPO_PUBLIC_PROD_API_URL` → a qué API pegan los builds (APK/AAB).
 *   OJO: EAS no lee `.env.local`, así que en la nube aplica este default.
 * - `EXPO_PUBLIC_API_URL`      → override total, SOLO en desarrollo.
 *
 * ⚠️ REGLA DE ORO: los builds (APK/AAB, `__DEV__ === false`) apuntan a PROD
 * SÍ O SÍ. El override `EXPO_PUBLIC_API_URL` se IGNORA al compilar release —
 * existió un APK roto porque la variable quedó viva en la terminal de una
 * prueba (`10.0.2.2:3000`) y se horneó en el bundle. Nunca más.
 *
 * Las `EXPO_PUBLIC_*` se inyectan al bundlear: tras cambiar `.env.local`,
 * reiniciar Metro con `npx expo start -c`.
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const DEV_API_URL =
  process.env.EXPO_PUBLIC_DEV_API_URL ?? `http://${DEV_HOST}:3000`;
const PROD_API_URL =
  process.env.EXPO_PUBLIC_PROD_API_URL ??
  'https://apimandaloprod.ecohotelsamawe.com';

const RAW_API_URL = (
  __DEV__
    ? (process.env.EXPO_PUBLIC_API_URL ?? DEV_API_URL)
    : PROD_API_URL
).replace(/\/+$/, '');

/**
 * Blindaje: en builds (release) NUNCA se habla http plano. Si una env quedó
 * apuntando a `http://` al compilar (p. ej. EXPO_PUBLIC_API_URL de una prueba
 * local), se fuerza https. Android release además bloquea cleartext, así que
 * sin esto la app simplemente no conectaría.
 */
export const API_URL = __DEV__
  ? RAW_API_URL
  : RAW_API_URL.replace(/^http:\/\//, 'https://');

/** Une la URL base con un path del API evitando slashes duplicados. */
export function apiUrl(path: string): string {
  return `${API_URL}/${path.replace(/^\/+/, '')}`;
}

/**
 * Client key que exige el `ApiKeyGuard` del backend (header `X-Client-Key`)
 * en los endpoints NO públicos. Se define en `.env.local`
 * (`EXPO_PUBLIC_CLIENT_API_KEY`) y debe coincidir con `APP_CLIENT_API_KEY`.
 */
export const CLIENT_API_KEY = process.env.EXPO_PUBLIC_CLIENT_API_KEY ?? '';

/**
 * Client ID "Web application" de Google Cloud Console (el MISMO que usa el
 * backend como audience para verificar el idToken). Se define en `.env.local`
 * (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`). Sin él, el botón de Google avisa que
 * la función no está configurada.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
