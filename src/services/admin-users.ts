import { http } from '@/lib/http';
import { filePart } from '@/lib/upload';

/** Codes de rol tal como están sembrados en la tabla `roleType` del backend. */
export type RoleCode = 'USER' | 'DELI' | 'NEGO' | 'ADMIN';

export type CatalogRef = {
  id: string | number;
  code?: string;
  name: string;
};

/** Item del listado paginado de `/user/paginated` (sin datos sensibles). */
export type AdminUser = {
  id: string;
  fullName: string;
  username: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  identificationNumber: string | null;
  avatarUrl: string | null;
  /** Documento del repartidor (subido en el registro DELI). */
  identificationFrontUrl: string | null;
  identificationBackUrl: string | null;
  /** Nota del admin para el usuario (por qué no se activa su cuenta, etc.). */
  observations: string | null;
  isActive: boolean;
  isBanned: boolean;
  isEmailVerified: boolean;
  roleType: CatalogRef | null;
  municipality: CatalogRef | null;
  department: CatalogRef | null;
  identificationType: CatalogRef | null;
  createdAt: string | null;
};

export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

export type AdminUserPayload = {
  fullName: string;
  email: string;
  /** Requerida al crear; no se envía al editar. */
  password?: string;
  /** `null` limpia el campo al editar (el backend lo acepta por @IsOptional). */
  username?: string | null;
  phone?: string | null;
  departmentId?: number;
  municipalityId?: number;
  address?: string | null;
  /** Coordenadas GPS (solo las envía la edición del propio perfil). */
  latitude?: number;
  longitude?: number;
  identificationNumber?: string | null;
  identificationTypeId?: number;
  /** El backend lo resuelve a su uuid (tabla roleType). */
  roleTypeCode?: RoleCode;
  isActive?: boolean;
  isBanned?: boolean;
  /** Nota del admin para el usuario; `null` la limpia (solo al editar). */
  observations?: string | null;
};

/** Campo por el que busca el admin ('search' = todos los campos a la vez). */
export type UserSearchField =
  | 'search'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'username'
  | 'identificationNumber';

/** CRUD de usuarios del panel de administración (endpoints con JWT). */
export const adminUsersService = {
  paginated: (params: {
    page: number;
    perPage?: number;
    /** Texto a buscar en el campo `searchField` (default: todos). */
    search?: string;
    searchField?: UserSearchField;
    roleTypeCode?: RoleCode;
    /** Varios roles a la vez (Usuarios = USER+NEGO+ADMIN). */
    roleTypeCodes?: RoleCode[];
    /** Filtros por estado de cuenta (chips del panel). */
    isActive?: boolean;
    isBanned?: boolean;
    isEmailVerified?: boolean;
  }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      perPage: String(params.perPage ?? 20),
      order: 'DESC',
    });
    if (params.search?.trim()) {
      query.set(params.searchField ?? 'search', params.search.trim());
    }
    if (params.roleTypeCode) query.set('roleTypeCode', params.roleTypeCode);
    if (params.roleTypeCodes?.length) {
      query.set('roleTypeCodes', params.roleTypeCodes.join(','));
    }
    if (params.isActive !== undefined) {
      query.set('isActive', String(params.isActive));
    }
    if (params.isBanned !== undefined) {
      query.set('isBanned', String(params.isBanned));
    }
    if (params.isEmailVerified !== undefined) {
      query.set('isEmailVerified', String(params.isEmailVerified));
    }

    return http<Paginated<AdminUser>>(`/user/paginated?${query.toString()}`, {
      auth: true,
    });
  },

  getById: (id: string) =>
    http<{ data: AdminUser }>(`/user/${id}`, { auth: true }),

  create: (payload: AdminUserPayload) =>
    http<{ data: { rowId: string } }>('/user/create', {
      method: 'POST',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  update: (id: string, payload: Partial<AdminUserPayload>) =>
    http<{ message?: string }>(`/user/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  remove: (id: string) =>
    http<{ message?: string }>(`/user/${id}`, {
      method: 'DELETE',
      auth: true,
      toastSuccess: true,
    }),

  /** Sube la foto de perfil (uri local cuadrada que devuelve el PhotoEditor). */
  uploadAvatar: (id: string, uri: string) => {
    const form = new FormData();
    form.append('file', filePart(uri), 'avatar.jpg');
    return http<{ data: { avatarUrl: string } }>(`/user/${id}/avatar`, {
      method: 'POST',
      body: form,
      auth: true,
    });
  },
};
