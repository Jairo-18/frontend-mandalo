import { useWindowDimensions } from 'react-native';

/**
 * Ancho a partir del cual la pantalla deja de tratarse como "un celular":
 * tablet horizontal y web de escritorio. No depende de `Platform.OS` — el
 * mismo criterio sirve para una tablet nativa y para el navegador (igual que
 * `columnsForWidth` en `lib/grid-style.ts`).
 */
export const WIDE_MIN_WIDTH = 720;

/**
 * `true` en tablet/escritorio. Usa `useWindowDimensions`, así que en web
 * responde solo al redimensionar la ventana (no hace falta recargar), y en
 * celular devuelve siempre `false` — el layout de móvil no cambia.
 */
export function useIsWideScreen(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_MIN_WIDTH;
}
