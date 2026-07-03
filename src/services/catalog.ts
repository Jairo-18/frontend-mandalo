import { apiUrl } from '@/constants/api';

export type Department = { id: number; code: string; name: string };
export type Municipality = {
  id: number;
  code: string;
  name: string;
  departmentId: number;
};
export type IdentificationType = { id: number; code: string; name: string };

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const raw = data?.message ?? 'No se pudieron cargar los datos';
    throw new Error(Array.isArray(raw) ? raw.join('\n') : String(raw));
  }
  return data as T;
}

/** Catálogos de la app (departamentos, municipios, tipos de identificación). */
export const catalogService = {
  getDepartments: () => getJson<Department[]>('/catalog/departments'),
  getMunicipalities: (departmentId: number) =>
    getJson<Municipality[]>(`/catalog/municipalities?departmentId=${departmentId}`),
  getIdentificationTypes: () =>
    getJson<IdentificationType[]>('/catalog/identification-types'),
};
