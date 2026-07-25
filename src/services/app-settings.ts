import { http } from '@/lib/http';

/**
 * Paleta de marca editable por el admin (pantalla "Aplicación", ver
 * NOTAS.md §50/§51). `primaryColor`/`darkColor` son ÚNICOS (identidad de
 * marca, no cambian con el tema); el resto tiene un par claro/oscuro
 * EXPLÍCITO — nada se deriva/adivina, el admin controla los dos.
 */
export type AppColors = {
  primaryColor: string;
  darkColor: string;
  surfaceLightColor: string;
  surfaceDarkColor: string;
  cardLightColor: string;
  cardDarkColor: string;
  textPrimaryLightColor: string;
  textPrimaryDarkColor: string;
  textSecondaryLightColor: string;
  textSecondaryDarkColor: string;
  borderLightColor: string;
  borderDarkColor: string;
};

/** Mismos valores que el default de la migración (fallback si falla la carga). */
export const DEFAULT_APP_COLORS: AppColors = {
  primaryColor: '#FF5A3C',
  darkColor: '#1E1E2D',
  surfaceLightColor: '#F2F2F2',
  surfaceDarkColor: '#12121B',
  cardLightColor: '#FFFFFF',
  cardDarkColor: '#262636',
  textPrimaryLightColor: '#1E1E2D',
  textPrimaryDarkColor: '#EDEDF2',
  textSecondaryLightColor: '#7A7A8A',
  textSecondaryDarkColor: '#A0A0B2',
  borderLightColor: '#E5E7EB',
  borderDarkColor: '#33334A',
};

/**
 * ¿Trae los 12 campos vigentes? El caché en disco (`catalog-cache.ts`)
 * puede tener un objeto VIEJO de una versión anterior de la app (antes eran
 * solo 4 colores) — sin esta validación, un campo nuevo faltante llega como
 * `undefined` a `hexToRgb()` y la app truena entera al abrir (pasó en
 * pruebas reales, ver NOTAS.md §51). Usar SIEMPRE antes de confiar en un
 * `AppColors` que no vino recién bajado del backend.
 */
export function isValidAppColors(value: unknown): value is AppColors {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(DEFAULT_APP_COLORS).every(
    (key) => typeof (value as Record<string, unknown>)[key] === 'string',
  );
}

export const appSettingsService = {
  /** Público (como /catalog): la app lo pide en el splash, antes de login. */
  get: () => http<{ data: AppColors & { id: number; updatedAt: string | null } }>('/app-settings'),

  /** Solo ADMIN. */
  update: (payload: Partial<AppColors>) =>
    http<{ message?: string }>('/app-settings', {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),
};
