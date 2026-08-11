import { http, httpUpload } from '@/lib/http';
import { filePart, xhrFilePart } from '@/lib/upload';
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

  /** Quita el logo del negocio propio (sin reemplazo). */
  removeMyLogo: () =>
    http<{ message?: string }>('/organizational/mine/logo', {
      method: 'DELETE',
      auth: true,
    }),

  /** Quita el QR de Bancolombia del negocio propio (sin reemplazo). */
  removeMyPaymentQr: () =>
    http<{ message?: string }>('/organizational/mine/payment-qr', {
      method: 'DELETE',
      auth: true,
    }),

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
    uploadImage: async (
      id: number,
      uri: string,
      onProgress?: (fraction: number) => void,
    ) => {
      // xhrFilePart (no filePart): este form viaja por `httpUpload`
      // (XMLHttpRequest, para progreso real), que en nativo usa el puente
      // clásico de RN — necesita `{uri,name,type}`, no el `File` de
      // expo-file-system que exige el `fetch` nuevo.
      const form = new FormData();
      form.append(
        'file',
        await xhrFilePart(uri, 'product.jpg', 'image/jpeg'),
        'product.jpg',
      );
      return httpUpload<{ data: { imageUrl: string; images: string[] } }>(
        `/product/${id}/image`,
        form,
        { auth: true, onProgress },
      );
    },

    /**
     * Quita una o varias fotos (URLs tal como están guardadas en `images`)
     * en UNA sola petición, aunque se hayan quitado varias a la vez al
     * editar el producto.
     */
    removeImages: (id: number, urls: string[]) =>
      http<{ data: { images: string[] } }>(
        `/product/${id}/image?urls=${urls.map(encodeURIComponent).join(',')}`,
        { method: 'DELETE', auth: true },
      ),
  },
};
