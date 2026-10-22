import { http, httpUpload } from '@/lib/http';
import { xhrFilePart } from '@/lib/upload';
import type { ExploreProduct } from '@/services/explore';

/** Días de vigencia que puede elegir el negocio (igual que el backend). */
export const PROMOTION_DURATIONS = [1, 3, 7, 15, 30] as const;
/** Máximo de promociones activas por negocio (igual que el backend). */
export const MAX_ACTIVE_PROMOTIONS = 5;

/** Promoción tal como la ve el cliente (carrusel del home y tienda). */
export type Promotion = {
  id: number;
  title: string;
  message: string | null;
  /** Banner 16:9 (1280×720). */
  imageUrl: string | null;
  price: number;
  /** Lo que costarían los productos sueltos (para tachar el precio normal). */
  regularPrice: number;
  endsAt: string;
  organizational: {
    id: number;
    legalName: string;
    tradeName: string | null;
    logoUrl: string | null;
    isOpen: boolean;
  } | null;
  items: {
    productId: number;
    name: string;
    quantity: number;
    imageUrl: string | null;
    /** Precio unitario vigente (con descuento) del producto suelto. */
    unitPrice: number;
  }[];
};

export type PromotionStatus = 'ACTIVE' | 'SCHEDULED' | 'PAUSED' | 'EXPIRED' | 'HIDDEN';

/** Promoción vista por su negocio (o el admin), con su estado. */
export type OwnerPromotion = Promotion & {
  status: PromotionStatus;
  isActive: boolean;
  hiddenByAdmin: boolean;
  startsAt: string;
};

export type PromotionPayload = {
  title: string;
  message?: string | null;
  price: number;
  /** Vigencia desde hoy. En edición, enviarlo RENUEVA la vigencia. */
  durationDays?: number;
  isActive?: boolean;
  items: { productId: number; quantity: number }[];
};

export const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  ACTIVE: 'Activa',
  SCHEDULED: 'Programada',
  PAUSED: 'Pausada',
  EXPIRED: 'Vencida',
  HIDDEN: 'Oculta por el admin',
};

/** "2× Hamburguesa, 1× Gaseosa". */
export function promotionContents(promo: Pick<Promotion, 'items'>): string {
  return promo.items.map((i) => `${i.quantity}× ${i.name}`).join(', ');
}

/**
 * La promo como un "producto" del carrito: id NEGATIVO (no choca con los
 * productos reales) y `promotionId` para que el checkout la mande como
 * promoción. Así el carrito, el contador y el checkout no cambian.
 */
export function promotionAsCartProduct(promo: Promotion): ExploreProduct {
  return {
    id: -promo.id,
    code: null,
    name: `Promo: ${promo.title}`,
    description: promotionContents(promo),
    categoryTypeId: null,
    categoryType: null,
    priceSale: promo.price,
    discount: 0,
    images: promo.imageUrl ? [promo.imageUrl] : [],
    promotionId: promo.id,
  };
}

export const promotionsService = {
  /** Carrusel del home (público): promos vigentes cerca de esas coordenadas. */
  feed: (coords?: { latitude: number; longitude: number } | null) =>
    http<{ data: Promotion[] }>(
      coords
        ? `/promotion/feed?lat=${coords.latitude}&lng=${coords.longitude}`
        : '/promotion/feed',
      { authOptional: true, toastError: false },
    ),

  /** Promos vigentes de un negocio (arriba en su tienda). Público. */
  forBusiness: (organizationalId: number) =>
    http<{ data: Promotion[] }>(`/promotion/business/${organizationalId}`, {
      authOptional: true,
      toastError: false,
    }),

  // ---------- negocio ----------
  mine: () => http<{ data: OwnerPromotion[] }>('/promotion/mine', { auth: true }),

  create: (payload: PromotionPayload) =>
    http<{ data: OwnerPromotion }>('/promotion', {
      method: 'POST',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  update: (id: number, payload: Partial<PromotionPayload>) =>
    http<{ data: OwnerPromotion }>(`/promotion/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  remove: (id: number) =>
    http<{ message?: string }>(`/promotion/${id}`, {
      method: 'DELETE',
      auth: true,
      toastSuccess: true,
    }),

  /** Banner: el servidor lo recorta 16:9 al centro. */
  uploadImage: async (id: number, uri: string, onProgress?: (f: number) => void) => {
    const form = new FormData();
    form.append('file', await xhrFilePart(uri, 'promo.jpg', 'image/jpeg'), 'promo.jpg');
    return httpUpload<{ data: { imageUrl: string } }>(`/promotion/${id}/image`, form, {
      auth: true,
      onProgress,
    });
  },

  // ---------- admin ----------
  adminForBusiness: (organizationalId: number) =>
    http<{ data: OwnerPromotion[] }>(`/promotion/admin/business/${organizationalId}`, {
      auth: true,
    }),

  setHidden: (id: number, hidden: boolean) =>
    http<{ message?: string }>(`/promotion/${id}/hidden`, {
      method: 'PATCH',
      body: { hidden },
      auth: true,
      toastSuccess: true,
    }),
};
