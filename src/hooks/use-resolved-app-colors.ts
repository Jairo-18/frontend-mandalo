import { useMemo } from 'react';

import { useAppData } from '@/context/app-data';
import { useAppTheme } from '@/context/app-theme';
import { resolveAppColors, ResolvedAppColors } from '@/lib/app-colors';

/**
 * Versión REACTIVA de `getAppColors()` (`lib/app-colors.ts`) — para los pocos
 * lugares donde el color literal vive dentro de un objeto que React Navigation
 * vuelve a usar en cada render pero que el compilador de React puede memoizar
 * "de más": si nada de lo que arma ese objeto es un valor reactivo que React
 * pueda rastrear (props/estado/contexto), el compilador lo cachea para
 * siempre — y `getAppColors()` es una función común y corriente sobre un
 * singleton mutable, invisible para ese análisis. Pasó de verdad con
 * `sceneStyle`/`headerStyle` de los Drawer (admin/negocio/repartidor/cliente):
 * el fondo quedaba pegado al primer color resuelto y no seguía el modo
 * oscuro. Este hook depende de `isDark`/`appColors` (contexto de verdad), así
 * que si se usa dentro de un `useMemo` o directo en JSX, el compilador SÍ
 * detecta la dependencia y recalcula cuando corresponde.
 */
export function useResolvedAppColors(): ResolvedAppColors {
  const { appColors } = useAppData();
  const { isDark } = useAppTheme();
  return useMemo(() => resolveAppColors(appColors, isDark), [appColors, isDark]);
}
