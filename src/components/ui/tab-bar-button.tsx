import { PlatformPressable } from 'expo-router/react-navigation';
import type { ComponentProps } from 'react';

/** Radio del "ripple" de Android al tocar una pestaña del menú inferior. */
const RIPPLE_RADIUS = 35;

/**
 * Botón de pestaña del menú inferior: el de react-navigation trae un ripple
 * de Android SIN límite (`borderless` sin radio) que se expande por todo el
 * ancho de la pestaña y se veía enorme — acá queda un círculo que cubre el
 * icono y el texto ("Direcciones"), dentro del alto del menú (`TAB_BAR_HEIGHT`). Debe seguir siendo `PlatformPressable` (ver el comentario de
 * `guardedTabBarButton` en `(client)/_layout.tsx` sobre la web).
 */
/** Alto del menú inferior SIN el inset del sistema (default de react-navigation: 49). */
export const TAB_BAR_HEIGHT = 74;

export function TabBarButton(props: ComponentProps<typeof PlatformPressable>) {
  return (
    <PlatformPressable
      {...props}
      android_ripple={{ ...props.android_ripple, borderless: true, radius: RIPPLE_RADIUS }}
    />
  );
}
