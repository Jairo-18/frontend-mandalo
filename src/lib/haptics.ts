import * as Haptics from 'expo-haptics';

/**
 * Respuesta táctil de la app. Envoltorio fino sobre `expo-haptics` con dos
 * reglas: no bloquea (fire-and-forget) y nunca rompe el flujo que lo disparó.
 *
 * Sirve en las tres plataformas, pero NO en todos los dispositivos — y eso es
 * normal, no hay nada que arreglar cuando no vibra:
 *
 * - **Android**: vibra siempre; el permiso `VIBRATE` lo agrega el propio plugin.
 * - **iOS**: queda sin efecto con Modo de bajo consumo, con el Taptic Engine
 *   apagado en ajustes, o mientras la cámara/el dictado están activos.
 * - **Web**: usa la Web Vibration API — Chrome en Android sí la implementa;
 *   Safari (iOS y Mac) no, y en escritorio no hay hardware que vibrar.
 *
 * De ahí el `.catch()`: en las plataformas sin soporte la promesa rechaza, y
 * eso no debe ensuciar la consola ni cortar la acción del usuario.
 */
function fire(run: () => Promise<void>): void {
  void run().catch(() => {});
}

export const haptics = {
  /** Toque corto y seco: agregar al carrito, elegir una opción. */
  tap: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Salió bien: pedido confirmado, dirección guardada. */
  success: () =>
    fire(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  /** Algo falló. */
  error: () =>
    fire(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    ),
};
