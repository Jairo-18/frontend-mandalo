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
  /** Comisión sobre lo vendido (%): 5 el primer mes, 12 después (el admin la sube a mano). */
  commissionOrderRate: number;
  /** Horario de atención (hora Colombia); null = siempre abierto. */
  openTime: string | null;
  closeTime: string | null;
  /** Días que abre (números 0–6, 0=domingo) separados por coma; null = todos. */
  openDays: string | null;
  temporarilyClosed: boolean;
  /** Datos de pago (los ve el cliente en el checkout si no paga en efectivo). */
  paymentHolderName: string | null;
  nequiNumber: string | null;
  nequiKey: string | null;
  bancolombiaAccount: string | null;
  bancolombiaQrUrl: string | null;
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
  /** Coordenadas del local (extraídas del link de Google Maps). */
  latitude?: number;
  longitude?: number;
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
  /** Comisión sobre lo vendido (%): solo el admin la cambia (5 → 12). */
  commissionOrderRate?: number;
  /** Horario de atención ("HH:MM" hora Colombia); null limpia el horario. */
  openTime?: string | null;
  closeTime?: string | null;
  /** Días que abre (0–6, 0=domingo) separados por coma; null = todos. */
  openDays?: string | null;
  temporarilyClosed?: boolean;
  /** Datos de pago (`null` limpia el campo). El QR va por upload aparte. */
  paymentHolderName?: string | null;
  nequiNumber?: string | null;
  nequiKey?: string | null;
  bancolombiaAccount?: string | null;
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
  uploadLogo: async (id: number, uri: string) => {
    const form = new FormData();
    form.append('file', await filePart(uri), 'logo.jpg');
    return http<{ data: { logoUrl: string } }>(`/organizational/${id}/logo`, {
      method: 'POST',
      body: form,
      auth: true,
    });
  },

  /** Sube/reemplaza el QR de Bancolombia del negocio. */
  uploadPaymentQr: async (id: number, uri: string) => {
    const form = new FormData();
    form.append('file', await filePart(uri), 'payment-qr.jpg');
    return http<{ data: { bancolombiaQrUrl: string } }>(
      `/organizational/${id}/payment-qr`,
      { method: 'POST', body: form, auth: true },
    );
  },
};
