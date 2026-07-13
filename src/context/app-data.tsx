import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { API_URL } from '@/constants/api';
import { loadCatalogCache, saveCatalogCache } from '@/lib/catalog-cache';
import { HttpError } from '@/lib/http';
import {
  catalogService,
  Department,
  IdentificationType,
  Municipality,
} from '@/services/catalog';

type AppData = {
  departments: Department[];
  identificationTypes: IdentificationType[];
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

  const [state, setState] = useState<State>(() =>
    cached
      ? {
          loading: false,
          error: null,
          errorDetail: null,
          departments: cached.departments,
          identificationTypes: cached.identificationTypes,
        }
      : {
          loading: true,
          error: null,
          errorDetail: null,
          departments: [],
          identificationTypes: [],
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
        const [departments, identificationTypes] = await Promise.all([
          catalogService.getDepartments(),
          catalogService.getIdentificationTypes(),
        ]);
        latestData.current = { departments, identificationTypes };
        setState({
          loading: false,
          error: null,
          errorDetail: null,
          departments,
          identificationTypes,
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

  const getMunicipalities = useCallback(
    async (departmentId: number) => {
      const cachedMuns = municipalitiesCache.current[departmentId];
      if (cachedMuns) return cachedMuns;
      const muns = await catalogService.getMunicipalities(departmentId);
      municipalitiesCache.current[departmentId] = muns;
      persist();
      return muns;
    },
    [persist],
  );

  if (state.loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF5A3C" />
        <Text className="mt-4 text-sm text-muted">Cargando Mandalo…</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="mb-2 text-center text-lg font-bold text-dark">
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
        getMunicipalities,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}
