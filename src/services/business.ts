import { http } from '@/lib/http';
import { filePart } from '@/lib/upload';
import { AdminBusiness, AdminBusinessPayload } from '@/services/admin-businesses';
import { CatalogRef, Paginated } from '@/services/admin-users';

/** Producto tal como lo devuelve `/product` (siempre del negocio propio). */
export type BusinessProduct = {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  categoryTypeId: number | null;
  categoryType: CatalogRef | null;
  priceSale: number;
  discount: number;
  /** URLs de las fotos; la primera es la principal. */
  images: string[];
  isActive: boolean;
  createdAt: string | null;
};

export type BusinessProductPayload = {
  name: string;
  /** `null` limpia el campo al editar. */
  code?: string | null;
  description?: string | null;
  categoryTypeId?: number | null;
  priceSale: number;
  /** Porcentaje 0–100. */
  discount?: number;
  isActive?: boolean;
};

/**
 * Panel del negocio (rol NEGO). El backend resuelve el negocio desde el JWT
 * (organizational con legalPersonId = usuario autenticado): acá nunca se
 * envía organizationalId y solo se ven/tocan los productos propios.
 */
export const businessService = {
  /** Negocio del usuario autenticado (cabecera del panel). */
  getMine: () =>
    http<{ data: AdminBusiness }>('/organizational/mine', { auth: true }),

  /**
   * Edita el negocio propio. El backend ignora dueño/cuenta/estado activo
   * (eso solo lo maneja el admin).
   */
  updateMine: (payload: Partial<AdminBusinessPayload>) =>
    http<{ message?: string }>('/organizational/mine', {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  /** Sube el logo del negocio propio (uri local del PhotoEditor). */
  uploadMyLogo: async (uri: string) => {
    const form = new FormData();
    form.append('file', await filePart(uri), 'logo.jpg');
    return http<{ data: { logoUrl: string } }>('/organizational/mine/logo', {
      method: 'POST',
      body: form,
      auth: true,
    });
  },

  /** Sube/reemplaza el QR de Bancolombia del negocio propio. */
  uploadMyPaymentQr: async (uri: string) => {
    const form = new FormData();
    form.append('file', await filePart(uri), 'payment-qr.jpg');
    return http<{ data: { bancolombiaQrUrl: string } }>(
      '/organizational/mine/payment-qr',
      { method: 'POST', body: form, auth: true },
    );
  },

  products: {
    paginated: (params: {
      page: number;
      perPage?: number;
      search?: string;
      categoryTypeId?: number;
    }) => {
      const query = new URLSearchParams({
        page: String(params.page),
        perPage: String(params.perPage ?? 20),
        order: 'ASC',
      });
      if (params.search?.trim()) query.set('search', params.search.trim());
      if (params.categoryTypeId) {
        query.set('categoryTypeId', String(params.categoryTypeId));
      }

      return http<Paginated<BusinessProduct>>(
        `/product/paginated?${query.toString()}`,
        { auth: true },
      );
    },

    create: (payload: BusinessProductPayload) =>
      http<{ data: { rowId: string } }>('/product/create', {
        method: 'POST',
        body: payload,
        auth: true,
        toastSuccess: true,
      }),

    update: (id: number, payload: Partial<BusinessProductPayload>) =>
      http<{ message?: string }>(`/product/${id}`, {
        method: 'PATCH',
        body: payload,
        auth: true,
        toastSuccess: true,
      }),

    remove: (id: number) =>
      http<{ message?: string }>(`/product/${id}`, {
        method: 'DELETE',
        auth: true,
        toastSuccess: true,
      }),

    /** Agrega una foto (uri local cuadrada que devuelve el PhotoEditor). */
    uploadImage: async (id: number, uri: string) => {
      const form = new FormData();
      form.append('file', await filePart(uri), 'product.jpg');
      return http<{ data: { imageUrl: string; images: string[] } }>(
        `/product/${id}/image`,
        { method: 'POST', body: form, auth: true },
      );
    },

    /** Quita una foto (la URL tal como está guardada en `images`). */
    removeImage: (id: number, url: string) =>
      http<{ data: { images: string[] } }>(
        `/product/${id}/image?url=${encodeURIComponent(url)}`,
        { method: 'DELETE', auth: true },
      ),
  },
};
