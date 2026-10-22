import { http } from '@/lib/http';
import { Paginated } from '@/services/admin-users';
import { ExploreBusiness, ExploreProduct } from '@/services/explore';

/** `available: false` = el negocio/producto se desactivó ("No disponible"). */
export type FavoriteBusinessItem = ExploreBusiness & { available: boolean };
export type FavoriteProductItem = ExploreProduct & { available: boolean };

export type FavoriteKind = 'business' | 'product';

/** Favoritos del usuario logueado (ver `lib/favorites.ts` para el estado). */
export const favoritesService = {
  /** Solo los ids, para pintar los corazones en todas las tarjetas. */
  ids: () =>
    http<{ data: { businessIds: number[]; productIds: number[] } }>('/favorite/ids', {
      auth: true,
      toastError: false,
    }),

  businesses: (params: { page: number; perPage?: number }) =>
    http<Paginated<FavoriteBusinessItem>>(
      `/favorite/businesses?page=${params.page}&perPage=${params.perPage ?? 10}`,
      { auth: true },
    ),

  products: (params: { page: number; perPage?: number }) =>
    http<Paginated<FavoriteProductItem>>(
      `/favorite/products?page=${params.page}&perPage=${params.perPage ?? 10}`,
      { auth: true },
    ),

  set: (kind: FavoriteKind, id: number, favorite: boolean) =>
    http<{ message?: string }>(`/favorite/${kind}/${id}`, {
      method: favorite ? 'PUT' : 'DELETE',
      auth: true,
    }),
};
