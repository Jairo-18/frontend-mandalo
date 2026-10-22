import { Linking, Platform } from 'react-native';

import { probeGoogleServices } from '@/lib/google-services';

/** `android.package` de app.json (el mismo en Google Play y AppGallery). */
const ANDROID_PACKAGE = 'com.mandalo.app';
/** Id de la app en App Store Connect (`ascAppId` de eas.json). */
const APPLE_APP_ID = '6813722121';

export type AppStoreKind = 'apple' | 'google' | 'huawei';

/** Nombre visible de cada tienda ("Califícanos en …"). */
export const STORE_LABEL: Record<AppStoreKind, string> = {
  apple: 'App Store',
  google: 'Google Play',
  huawei: 'AppGallery',
};

/** En web: Mac, iPhone o iPad (por el navegador) → App Store. */
function isAppleWeb(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * De qué tienda vino la app: iPhone → App Store; Android con servicios de
 * Google → Google Play; Android SIN ellos (Huawei nuevos) → AppGallery. En
 * la web se elige por el equipo: Apple → App Store, cualquier otro →
 * Google Play.
 */
export function storeFor(googleServices: boolean): AppStoreKind {
  if (Platform.OS === 'ios') return 'apple';
  if (Platform.OS === 'android') return googleServices ? 'google' : 'huawei';
  return isAppleWeb() ? 'apple' : 'google';
}

/** Abre la primera URL que el teléfono sepa abrir (app de la tienda → web). */
async function openFirst(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // Esa tienda no está instalada: se prueba la siguiente.
    }
  }
}

/**
 * Lleva al usuario a dejar su reseña de la app en su tienda: directo al
 * formulario de reseña en App Store; a la ficha en Google Play y AppGallery
 * (ninguna de las dos expone un enlace al formulario).
 */
export async function openStoreReview(): Promise<void> {
  if (Platform.OS === 'ios') {
    await openFirst([
      `itms-apps://apps.apple.com/app/id${APPLE_APP_ID}?action=write-review`,
      `https://apps.apple.com/app/id${APPLE_APP_ID}?action=write-review`,
    ]);
    return;
  }
  if (Platform.OS === 'web') {
    // En el navegador no hay app de tienda: la página web de la ficha.
    const url = isAppleWeb()
      ? `https://apps.apple.com/app/id${APPLE_APP_ID}?action=write-review`
      : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
    globalThis.open?.(url, '_blank', 'noopener');
    return;
  }
  if (Platform.OS !== 'android') return;

  const googleServices = await probeGoogleServices();
  await openFirst(
    googleServices
      ? [
          `market://details?id=${ANDROID_PACKAGE}`,
          `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
        ]
      : [
          `appmarket://details?id=${ANDROID_PACKAGE}`,
          `market://details?id=${ANDROID_PACKAGE}`,
        ],
  );
}
