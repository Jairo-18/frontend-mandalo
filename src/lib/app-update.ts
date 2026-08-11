import { useEffect } from 'react';
import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  IAUInstallStatus,
} from 'sp-react-native-in-app-updates';

/**
 * Al abrir la app, revisa si hay una versión más nueva publicada en Google
 * Play y, si la hay, la descarga en segundo plano y muestra el aviso propio
 * de Google (una barra abajo, no bloqueante) para reiniciar e instalarla —
 * API oficial "In-App Updates" (Play Core), sin costo. Sin esto, el
 * dispositivo del tester decide solo cuándo actualiza (según su config de
 * "actualizar apps automáticamente"), lo que puede tardar horas/días.
 *
 * Solo Android: es la única plataforma donde la app está publicada hoy (ver
 * docs/IOS_TESTFLIGHT.md — iOS sigue bloqueado por la cuenta de Apple). La
 * librería sí soporta iOS (vía iTunes Search API), así que activarlo ahí en
 * el futuro es tan simple como quitar el `if` de abajo.
 *
 * FLEXIBLE (no IMMEDIATE): descarga de fondo, el tester sigue usando la app
 * mientras tanto — más apropiado para un grupo chico de testers conocidos
 * que un update bloqueante de pantalla completa.
 */
export function useAppUpdateCheck(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const inAppUpdates = new SpInAppUpdates(__DEV__);

    const onStatusUpdate = (status: { status: IAUInstallStatus }) => {
      // Ya se descargó: falta el paso final (reinicia la app con la
      // versión nueva). Google ya le mostró su propia barra con el botón
      // "Reiniciar" — instalar acá es el fallback si el tester la ignora.
      if (status.status === IAUInstallStatus.DOWNLOADED) {
        inAppUpdates.installUpdate();
      }
    };
    inAppUpdates.addStatusUpdateListener(onStatusUpdate);

    inAppUpdates
      .checkNeedsUpdate()
      .then((result) => {
        if (!result.shouldUpdate) return;
        return inAppUpdates.startUpdate({
          updateType: IAUUpdateKind.FLEXIBLE,
        });
      })
      .catch(() => {
        // Sin Play Store instalado/disponible (algunos emuladores), sin
        // conexión, etc. — no es crítico, la app sigue funcionando igual.
      });

    return () => {
      inAppUpdates.removeStatusUpdateListener(onStatusUpdate);
    };
  }, []);
}
