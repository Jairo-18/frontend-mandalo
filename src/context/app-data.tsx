import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { vars } from 'nativewind';

import { Button } from '@/components/ui/button';
import { API_URL } from '@/constants/api';
import { useAppTheme } from '@/context/app-theme';
import { getAppColors, setCurrentAppColors } from '@/lib/app-colors';
import { hexToRgbTriplet, lightenHex } from '@/lib/color';
import { loadCatalogCache, saveCatalogCache } from '@/lib/catalog-cache';
import { HttpError } from '@/lib/http';
import {
  AppColors,
  appSettingsService,
  DEFAULT_APP_COLORS,
  isValidAppColors,
} from '@/services/app-settings';
import {
  catalogService,
  Department,
  IdentificationType,
  Municipality,
} from '@/services/catalog';

type AppData = {
  departments: Department[];
  identificationTypes: IdentificationType[];
  /**
   * Paleta de marca editable por el admin (§50): valores resueltos (hex) para
   * los pocos lugares que necesitan un string literal (iconos, spinners,
   * StatusBar) en vez de una clase de Tailwind (`bg-primary` etc. ya siguen
   * las variables CSS solas, ver `AppColorsRoot` más abajo).
   */
  appColors: AppColors;
  /** Municipios de un departamento (con caché en memoria y en disco). */
  getMunicipalities: (departmentId: number) => Promise<Municipality[]>;
};

const AppDataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData debe usarse dentro de <AppDataProvider>');
  }
  return ctx;
}

type State = {
  loading: boolean;
  error: string | null;
  /** Causa técnica del fallo (TLS, DNS, timeout, HTTP xxx) para diagnóstico. */
  errorDetail: string | null;
  departments: Department[];
  identificationTypes: IdentificationType[];
  appColors: AppColors;
};

/**
 * Extrae la causa técnica de un fallo de carga. Con un pantallazo de la
 * pantalla de error se puede saber si el problema del dispositivo es TLS
 * (Android viejo sin la raíz de Let's Encrypt), DNS, timeout o un HTTP real.
 */
function extractErrorDetail(e: unknown): string | null {
  if (e instanceof HttpError) {
    if (e.status !== 0) return `HTTP ${e.status}`;
    const cause =
      e.body && typeof e.body === 'object' && 'cause' in e.body
        ? (e.body as { cause?: unknown }).cause
        : null;
    return cause ? String(cause) : null;
  }
  return e instanceof Error ? `${e.name}: ${e.message}` : null;
}

/**
 * Carga inicial de la app con caché en disco (stale-while-revalidate):
 * - Con caché → la app abre AL INSTANTE con los catálogos guardados y se
 *   refrescan desde el backend en segundo plano (si cambió algo, el estado
 *   se actualiza solo; si el backend no responde, se sigue con lo guardado).
 * - Sin caché (primer arranque) → splash mientras carga y pantalla de error
 *   con reintento, como siempre.
 * Los municipios se cargan por departamento bajo demanda (~1100 en total) y
 * también quedan cacheados.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: el archivo de caché se lee UNA sola vez, en el primer render.
  const [cached] = useState(loadCatalogCache);
  const { isDark } = useAppTheme();

  // Un caché VIEJO (de antes de los 12 campos, §51) puede traer un
  // `appColors` incompleto — sin validar, un campo `undefined` truena la app
  // entera al abrir (ver NOTAS.md §51). Si no calza, se usa el default hasta
  // que el fetch fresco lo reemplace.
  const cachedAppColors =
    cached && isValidAppColors(cached.appColors) ? cached.appColors : DEFAULT_APP_COLORS;

  const [state, setState] = useState<State>(() =>
    cached
      ? {
          loading: false,
          error: null,
          errorDetail: null,
          departments: cached.departments,
          identificationTypes: cached.identificationTypes,
          appColors: cachedAppColors,
        }
      : {
          loading: true,
          error: null,
          errorDetail: null,
          departments: [],
          identificationTypes: [],
          appColors: DEFAULT_APP_COLORS,
        },
  );

  const municipalitiesCache = useRef<Record<number, Municipality[]>>(
    cached?.municipalitiesByDepartment ?? {},
  );
  // Última versión confirmada de los catálogos (para persistir junto con los
  // municipios sin depender del ciclo de renders).
  const latestData = useRef({
    departments: cached?.departments ?? [],
    identificationTypes: cached?.identificationTypes ?? [],
    appColors: cachedAppColors,
  });

  const persist = useCallback(() => {
    if (latestData.current.departments.length === 0) return;
    saveCatalogCache({
      ...latestData.current,
      municipalitiesByDepartment: municipalitiesCache.current,
    });
  }, []);

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const [departments, identificationTypes, appColorsRes] = await Promise.all([
          catalogService.getDepartments(),
          catalogService.getIdentificationTypes(),
          appSettingsService.get(),
        ]);
        const appColors: AppColors = {
          primaryColor: appColorsRes.data.primaryColor,
          darkColor: appColorsRes.data.darkColor,
          surfaceLightColor: appColorsRes.data.surfaceLightColor,
          surfaceDarkColor: appColorsRes.data.surfaceDarkColor,
          cardLightColor: appColorsRes.data.cardLightColor,
          cardDarkColor: appColorsRes.data.cardDarkColor,
          textPrimaryLightColor: appColorsRes.data.textPrimaryLightColor,
          textPrimaryDarkColor: appColorsRes.data.textPrimaryDarkColor,
          textSecondaryLightColor: appColorsRes.data.textSecondaryLightColor,
          textSecondaryDarkColor: appColorsRes.data.textSecondaryDarkColor,
          borderLightColor: appColorsRes.data.borderLightColor,
          borderDarkColor: appColorsRes.data.borderDarkColor,
        };
        latestData.current = { departments, identificationTypes, appColors };
        setState({
          loading: false,
          error: null,
          errorDetail: null,
          departments,
          identificationTypes,
          appColors,
        });
        persist();
      } catch (e) {
        // Refresco en segundo plano fallido → se sigue con la caché, sin molestar.
        if (silent) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e.message : 'Error cargando la aplicación',
          errorDetail: extractErrorDetail(e),
        }));
      }
    },
    [persist],
  );

  useEffect(() => {
    load({ silent: !!cached });
    // `cached` y `load` son estables: esto corre una sola vez al montar.
  }, [cached, load]);

  // Deduplica peticiones concurrentes del mismo departamento (dos selects
  // precargando a la vez harían 2 requests idénticos).
  const municipalitiesInFlight = useRef<Record<number, Promise<Municipality[]>>>(
    {},
  );

  const getMunicipalities = useCallback(
    async (departmentId: number) => {
      const cachedMuns = municipalitiesCache.current[departmentId];
      if (cachedMuns) return cachedMuns;

      const inFlight = municipalitiesInFlight.current[departmentId];
      if (inFlight) return inFlight;

      const promise = catalogService
        .getMunicipalities(departmentId)
        .then((muns) => {
          municipalitiesCache.current[departmentId] = muns;
          persist();
          return muns;
        })
        .finally(() => {
          delete municipalitiesInFlight.current[departmentId];
        });
      municipalitiesInFlight.current[departmentId] = promise;
      return promise;
    },
    [persist],
  );

  // Inyecta la paleta del admin como variables CSS reales (NativeWind
  // `vars()`) para que las clases `bg-primary`/`bg-surface`/`bg-card`/
  // `text-ink`/`text-muted`/`border-border`/etc. la sigan solas. Desde §51
  // el admin controla el par claro/oscuro de cada una EXPLÍCITAMENTE — acá
  // solo se elige cuál de los dos usar según `isDark`, sin derivar/adivinar
  // nada (antes `surface`/`muted` se calculaban con matemática de color).
  // Mismo valor que el context, disponible fuera de React (ver lib/app-colors.ts).
  // OJO: esto y el `useMemo` de abajo tienen que ir ANTES de los `return`
  // condicionales de loading/error — si no, en la transición cargando→cargado
  // React ve una cantidad distinta de hooks entre un render y el siguiente y
  // truena la app entera (Regla de los Hooks). En Android casi nunca se nota
  // porque casi siempre hay caché en disco y `loading` arranca en `false`
  // desde el primer render; en la WEB (`expo-file-system` no existe ahí, el
  // caché siempre es `null`) esa transición pasa SIEMPRE — ahí el crash era
  // 100% reproducible al abrir la app.
  setCurrentAppColors(state.appColors, isDark);

  const cssVars = useMemo(() => {
    const c = state.appColors;
    return vars({
      '--color-primary': hexToRgbTriplet(c.primaryColor),
      '--color-primary-soft': hexToRgbTriplet(lightenHex(c.primaryColor, 68)),
      '--color-primary-tint': hexToRgbTriplet(lightenHex(c.primaryColor, 93, 40)),
      '--color-dark': hexToRgbTriplet(c.darkColor),
      '--color-surface': hexToRgbTriplet(isDark ? c.surfaceDarkColor : c.surfaceLightColor),
      '--color-card': hexToRgbTriplet(isDark ? c.cardDarkColor : c.cardLightColor),
      '--color-ink': hexToRgbTriplet(isDark ? c.textPrimaryDarkColor : c.textPrimaryLightColor),
      '--color-muted': hexToRgbTriplet(isDark ? c.textSecondaryDarkColor : c.textSecondaryLightColor),
      '--color-border': hexToRgbTriplet(isDark ? c.borderDarkColor : c.borderLightColor),
    });
  }, [state.appColors, isDark]);

  // En WEB, `<Modal>` (react-native-web) monta su contenido en un portal
  // pegado directo a `document.body` — fuera del árbol de React, así que el
  // `<View style={cssVars}>` de abajo no le llega por herencia normal de
  // React. Sin esto, cualquier diálogo/hoja (Agregar al carrito, YesNoDialog,
  // etc.) se queda pintado con el naranja default de global.css en vez del
  // color que puso el admin. Escribir las variables directo en `:root` sí
  // llega a los portales (herencia real de CSS, no de React).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, String(value));
    });
  }, [cssVars]);

  if (state.loading) {
    // Colores explícitos (no `bg-card`/`text-muted`): esta pantalla sale
    // ANTES de que se resuelva la preferencia de tema real (guardada en
    // disco, async) y antes de que lleguen los appSettings del backend —
    // usar clases dependientes del tema acá corría el riesgo de mezclar un
    // `isDark` viejo con colores nuevos y verse gris/deslavado. Con hex fijo
    // (los defaults de marca) se ve igual siempre, sin parpadeo.
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <ActivityIndicator size="large" color={getAppColors().primaryColor} />
        <Text className="mt-4 text-sm" style={{ color: '#7A7A8A' }}>
          Cargando Mandalo…
        </Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View className="flex-1 items-center justify-center bg-card px-8">
        <Text className="mb-2 text-center text-lg font-bold text-ink">
          No se pudo cargar la app
        </Text>
        <Text className="mb-6 text-center text-sm text-muted">
          {state.error}
        </Text>
        <View className="w-full">
          <Button label="Reintentar" onPress={() => load()} />
        </View>
        {/* Detalle técnico para soporte: con un pantallazo se diagnostica remoto. */}
        <Text className="mt-6 text-center text-[10px] text-muted/70">
          {API_URL.replace(/^https?:\/\//, '')}
          {state.errorDetail ? `\n${state.errorDetail}` : ''}
        </Text>
      </View>
    );
  }

  return (
    <AppDataContext.Provider
      value={{
        departments: state.departments,
        identificationTypes: state.identificationTypes,
        appColors: state.appColors,
        getMunicipalities,
      }}
    >
      <View style={cssVars} className="flex-1">
        {children}
      </View>
    </AppDataContext.Provider>
  );
}
