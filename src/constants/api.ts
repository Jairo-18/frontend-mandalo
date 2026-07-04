import { Platform } from 'react-native';

/**
 * URL base del backend según el entorno.
 * - Desarrollo (`expo start`, __DEV__ === true):
 *     · Android (emulador): http://10.0.2.2:3000  (10.0.2.2 = localhost del PC host)
 *     · iOS / web:          http://localhost:3000
 * - Producción (build de EAS): https://apimandalo.ecohotelsamawe.com
 *
 * Se puede sobreescribir con la variable de entorno `EXPO_PUBLIC_API_URL`
 * (p. ej. desde un dispositivo físico usando la IP LAN de tu PC:
 *  EXPO_PUBLIC_API_URL=http://192.168.x.x:3000).
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEV_API_URL = `http://${DEV_HOST}:3000`;
const PROD_API_URL = 'https://apimandalo.ecohotelsamawe.com';

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? DEV_API_URL : PROD_API_URL)
).replace(/\/+$/, '');

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
