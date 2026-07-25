import { AppColors, DEFAULT_APP_COLORS } from '@/services/app-settings';

/**
 * Colores YA resueltos para el tema activo (claro u oscuro) — lo que
 * consumen los ~100+ lugares que necesitan un color literal (iconos,
 * spinners, `tintColor`, `sceneStyle`, degradados) donde una clase de
 * Tailwind (`bg-primary`) no aplica. `primaryColor`/`darkColor` son únicos
 * (no cambian con el tema); el resto ya viene elegido entre el par claro/
 * oscuro que edita el admin — nadie afuera tiene que hacer el ternario.
 */
export type ResolvedAppColors = {
  primaryColor: string;
  darkColor: string;
  surfaceColor: string;
  cardColor: string;
  /** Texto/ícono principal (títulos) — antes se aproximaba con `darkColor` + aclarado. */
  inkColor: string;
  /** Texto/ícono secundario (subtítulos, placeholders) — nombre histórico "muted". */
  mutedColor: string;
  borderColor: string;
};

/**
 * Misma resolución que usa el singleton de abajo, pero exportada para
 * `hooks/use-resolved-app-colors.ts`: ahí SÍ hace falta que sea reactiva de
 * verdad (ver ese archivo para el porqué — el singleton no le sirve al Drawer
 * de admin/negocio/repartidor/cliente).
 */
export function resolveAppColors(colors: AppColors, isDark: boolean): ResolvedAppColors {
  return {
    primaryColor: colors.primaryColor,
    darkColor: colors.darkColor,
    surfaceColor: isDark ? colors.surfaceDarkColor : colors.surfaceLightColor,
    cardColor: isDark ? colors.cardDarkColor : colors.cardLightColor,
    inkColor: isDark ? colors.textPrimaryDarkColor : colors.textPrimaryLightColor,
    mutedColor: isDark ? colors.textSecondaryDarkColor : colors.textSecondaryLightColor,
    borderColor: isDark ? colors.borderDarkColor : colors.borderLightColor,
  };
}

/**
 * Última paleta cargada (§50/§51), accesible fuera de React — mismo patrón
 * que `lib/toast.ts`/`lib/sign-out.ts`: un valor mutable a nivel de módulo
 * que `context/app-data.tsx` mantiene al día (incluido el tema activo, en
 * cada render). Como el admin cambia los colores muy de vez en cuando y ya
 * quedó definido que aplican "al reabrir la app", no hace falta que estos
 * lugares sean reactivos — les basta con leer el valor vigente en cada render.
 */
let current: ResolvedAppColors = resolveAppColors(DEFAULT_APP_COLORS, false);

export function setCurrentAppColors(colors: AppColors, isDark: boolean): void {
  current = resolveAppColors(colors, isDark);
}

export function getAppColors(): ResolvedAppColors {
  return current;
}
