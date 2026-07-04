import { File, Paths } from 'expo-file-system';

import type {
  Department,
  IdentificationType,
  Municipality,
} from '@/services/catalog';

/**
 * Caché en disco de los catálogos (stale-while-revalidate): la app arranca al
 * instante con lo guardado y `AppDataProvider` refresca desde el backend en
 * segundo plano. Va en el directorio de caché del sistema (el SO puede
 * limpiarlo; si pasa, simplemente vuelve el splash de la primera vez).
 */
export type CatalogCache = {
  departments: Department[];
  identificationTypes: IdentificationType[];
  /** Municipios ya consultados alguna vez, por departamento. */
  municipalitiesByDepartment: Record<number, Municipality[]>;
  savedAt: string;
};

const FILE_NAME = 'catalog-cache.json';

export function loadCatalogCache(): CatalogCache | null {
  try {
    const file = new File(Paths.cache, FILE_NAME);
    if (!file.exists) return null;
    const parsed = JSON.parse(file.textSync()) as CatalogCache;
    if (
      !Array.isArray(parsed.departments) ||
      parsed.departments.length === 0 ||
      !Array.isArray(parsed.identificationTypes)
    ) {
      return null;
    }
    return {
      ...parsed,
      municipalitiesByDepartment: parsed.municipalitiesByDepartment ?? {},
    };
  } catch {
    // Sin file system (web) o JSON corrupto → se carga desde el backend.
    return null;
  }
}

export function saveCatalogCache(
  cache: Omit<CatalogCache, 'savedAt'>,
): void {
  try {
    const file = new File(Paths.cache, FILE_NAME);
    file.write(
      JSON.stringify({ ...cache, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Sin file system → la app funciona igual, solo sin caché.
  }
}
