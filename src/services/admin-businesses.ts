import { http } from '@/lib/http';
import { filePart } from '@/lib/upload';
import { CatalogItem } from '@/services/admin-catalogs';
import { CatalogRef, Paginated } from '@/services/admin-users';

/** Representante legal tal como lo devuelve `/organizational` (datos visibles). */
export type BusinessOwner = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  identificationNumber: string | null;
};

/** Item del listado paginado de `/organizational/paginated`. */
export type AdminBusiness = {
  id: number;
  legalName: string;
  tradeName: string | null;
  identificationNumber: string | null;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  identificationType: CatalogRef | null;
  municipality: CatalogRef | null;
  department: CatalogRef | null;
  legalPerson: BusinessOwner | null;
  tags: CatalogItem[];
  createdAt: string | null;
};

export type AdminBusinessPayload = {
  legalName: string;
  tradeName?: string | null;
  identificationNumber?: string | null;
  identificationTypeId?: number;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  departmentId?: number;
  municipalityId?: number;
  /** Usuario dueño/representante legal (rol NEGO). */
  legalPersonId?: string;
  /**
   * Crear la cuenta de acceso del negocio en el mismo paso (rol NEGO).
   * Van en pareja y son excluyentes con `legalPersonId`. Solo al crear.
   */
  accountEmail?: string;
  accountPassword?: string;
  /** Reemplaza el set completo de etiquetas del negocio. */
  tagIds?: number[];
  isActive?: boolean;
};

/** Campo por el que busca el admin ('search' = nombre comercial/razón/NIT). */
export type BusinessSearchField = 'search' | 'legalName' | 'identificationNumber';

/** CRUD de negocios del panel de administración (endpoints con JWT). */
export const adminBusinessesService = {
  paginated: (params: {
    page: number;
    perPage?: number;
    /** Texto a buscar en el campo `searchField` (default: todos). */
    search?: string;
    searchField?: BusinessSearchField;
    /** Filtro por tipo de identificación. */
    identificationTypeId?: number;
  }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      perPage: String(params.perPage ?? 20),
      order: 'ASC',
    });
    if (params.search?.trim()) {
      query.set(params.searchField ?? 'search', params.search.trim());
    }
    if (params.identificationTypeId) {
      query.set('identificationTypeId', String(params.identificationTypeId));
    }

    return http<Paginated<AdminBusiness>>(
      `/organizational/paginated?${query.toString()}`,
      { auth: true },
    );
  },

  create: (payload: AdminBusinessPayload) =>
    http<{ data: { rowId: string } }>('/organizational/create', {
      method: 'POST',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  update: (id: number, payload: Partial<AdminBusinessPayload>) =>
    http<{ message?: string }>(`/organizational/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  remove: (id: number) =>
    http<{ message?: string }>(`/organizational/${id}`, {
      method: 'DELETE',
      auth: true,
      toastSuccess: true,
    }),

  /** Sube el logo del negocio (uri local cuadrada que devuelve el PhotoEditor). */
  uploadLogo: (id: number, uri: string) => {
    const form = new FormData();
    form.append('file', filePart(uri), 'logo.jpg');
    return http<{ data: { logoUrl: string } }>(`/organizational/${id}/logo`, {
      method: 'POST',
      body: form,
      auth: true,
    });
  },
};
