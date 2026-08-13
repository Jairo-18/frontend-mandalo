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

/**
 * ARL global de la plataforma (reunión con el cliente 2026-08-04): una sola
 * póliza que cubre a TODOS los repartidores — se le muestra a cualquiera que
 * reporte un accidente. Vive en la misma fila `appSettings`, pero separado
 * de `AppColors` a propósito: `isValidAppColors` exige los 12 campos de
 * color exactos y no debe romperse por estos dos opcionales.
 */
export type PlatformArl = {
  arlCompanyName: string | null;
  arlPolicyNumber: string | null;
};

/**
 * Redes y contacto públicos de la plataforma: el admin los carga una sola
 * vez desde "Aplicación" y se muestran en login/registro (debajo de
 * "¿Cómo funciona Mandalo?") y en la ayuda de los 4 roles. Igual que
 * `PlatformArl`, viven en la misma fila `appSettings` pero SEPARADOS de
 * `AppColors` — `isValidAppColors` no debe romperse por estos 4 opcionales.
 */
export type PlatformSocial = {
  youtubeUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  contactPhone: string | null;
};

export const DEFAULT_PLATFORM_SOCIAL: PlatformSocial = {
  youtubeUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  contactPhone: null,
};

export const appSettingsService = {
  /** Público (como /catalog): la app lo pide en el splash, antes de login. */
  get: () =>
    http<{
      data: AppColors &
        PlatformArl &
        PlatformSocial & { id: number; updatedAt: string | null };
    }>('/app-settings'),

  /** Solo ADMIN. */
  update: (
    payload: Partial<AppColors> & Partial<PlatformArl> & Partial<PlatformSocial>,
  ) =>
    http<{ message?: string }>('/app-settings', {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),
};
