import { http } from '@/lib/http';
import { filePart } from '@/lib/upload';

/** Dirección de entrega del usuario autenticado (tabla `userAddress`). */
export type UserAddress = {
  id: number;
  label: string;
  address: string;
  details: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  /** Foto de la fachada/portón (la ve el repartidor al entregar). */
  photoUrl: string | null;
  createdAt: string | null;
};

export type UserAddressPayload = {
  label: string;
  address: string;
  /** `null` limpia el campo al editar. */
  details?: string | null;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
};

/**
 * Direcciones del usuario autenticado. El backend las limita al userId del
 * JWT: acá nunca se envía el dueño. Siempre hay UNA principal (isDefault);
 * elegir "enviar a X" = marcarla principal.
 */
export const userAddressesService = {
  /** Mis direcciones, la principal primero. */
  list: () =>
    http<{ data: UserAddress[] }>('/user-address', { auth: true }),

  create: (payload: UserAddressPayload) =>
    http<{ data: { rowId: string } }>('/user-address/create', {
      method: 'POST',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  update: (id: number, payload: Partial<UserAddressPayload>) =>
    http<{ message?: string }>(`/user-address/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  /** Sube/reemplaza la foto de la dirección (el backend la optimiza a webp). */
  uploadPhoto: async (id: number, uri: string) => {
    const form = new FormData();
    form.append('file', await filePart(uri));
    return http<{ data: { photoUrl: string } }>(`/user-address/${id}/photo`, {
      method: 'POST',
      body: form,
      auth: true,
    });
  },

  removePhoto: (id: number) =>
    http<{ message?: string }>(`/user-address/${id}/photo`, {
      method: 'DELETE',
      auth: true,
    }),

  /** Marca la dirección como principal (a donde se envía por defecto). */
  setDefault: (id: number) =>
    http<{ message?: string }>(`/user-address/${id}`, {
      method: 'PATCH',
      body: { isDefault: true },
      auth: true,
    }),

  remove: (id: number) =>
    http<{ message?: string }>(`/user-address/${id}`, {
      method: 'DELETE',
      auth: true,
      toastSuccess: true,
    }),
};
