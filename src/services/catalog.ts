import { http } from '@/lib/http';

export type Department = { id: number; code: string; name: string };
export type Municipality = {
  id: number;
  code: string;
  name: string;
  departmentId: number;
};
export type IdentificationType = { id: number; code: string; name: string };

/**
 * Catálogos de la app. Departamentos y tipos de identificación se cargan al
 * inicio (el error lo maneja la pantalla de carga, por eso `toastError: false`
 * para no duplicar). Los municipios son bajo demanda → sí muestran toast si fallan.
 */
export const catalogService = {
  getDepartments: () =>
    http<Department[]>('/catalog/departments', { toastError: false }),

  getMunicipalities: (departmentId: number) =>
    http<Municipality[]>(`/catalog/municipalities?departmentId=${departmentId}`),

  getIdentificationTypes: () =>
    http<IdentificationType[]>('/catalog/identification-types', {
      toastError: false,
    }),
};
