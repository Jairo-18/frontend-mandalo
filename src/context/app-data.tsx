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
import {
  catalogService,
  Department,
  IdentificationType,
  Municipality,
} from '@/services/catalog';

type AppData = {
  departments: Department[];
  identificationTypes: IdentificationType[];
  /** Municipios de un departamento (con caché en memoria). */
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
  departments: Department[];
  identificationTypes: IdentificationType[];
};

/**
 * Carga inicial de la app: trae departamentos y tipos de identificación al
 * abrir. Muestra un splash mientras carga y una pantalla de error con
 * reintento si el backend no responde. Los municipios se cargan por
 * departamento bajo demanda (son ~1100 en total).
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    departments: [],
    identificationTypes: [],
  });

  const municipalitiesCache = useRef<Record<number, Municipality[]>>({});

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [departments, identificationTypes] = await Promise.all([
        catalogService.getDepartments(),
        catalogService.getIdentificationTypes(),
      ]);
      setState({ loading: false, error: null, departments, identificationTypes });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Error cargando la aplicación',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getMunicipalities = useCallback(async (departmentId: number) => {
    const cached = municipalitiesCache.current[departmentId];
    if (cached) return cached;
    const muns = await catalogService.getMunicipalities(departmentId);
    municipalitiesCache.current[departmentId] = muns;
    return muns;
  }, []);

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
          <Button label="Reintentar" onPress={load} />
        </View>
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
