import { http } from '@/lib/http';
import { Paginated } from '@/services/admin-users';

/** Etiqueta o categoría con icono (chips de filtros del explorar). */
export type ExploreFilterItem = {
  id: number;
  code: string;
  name: string;
  icon: string | null;
};

/** Negocio tal como lo ve el cliente (sin NIT ni datos del dueño). */
export type ExploreBusiness = {
  id: number;
  legalName: string;
  tradeName: string | null;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  municipality: { id: number; name: string } | null;
  tags: ExploreFilterItem[];
};

/** Producto activo de un negocio (vista del cliente). */
export type ExploreProduct = {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  categoryTypeId: number | null;
  categoryType: ExploreFilterItem | null;
  priceSale: number;
  discount: number;
  /** URLs de las fotos; la primera es la principal. */
  images: string[];
  /** El negocio que lo vende (solo en la búsqueda global del home). */
  organizational?: {
    id: number;
    legalName: string;
    tradeName: string | null;
    logoUrl: string | null;
  } | null;
};

/** Nombre que ve el cliente: nombre comercial o, si no hay, razón social. */
export function businessDisplayName(business: {
  tradeName: string | null;
  legalName: string;
}): string {
  return business.tradeName || business.legalName;
}

/**
 * Explorar (rol USER): negocios visibles (activos y con productos activos)
 * y sus productos. Solo lectura contra `/explore`.
 */
export const exploreService = {
  /** Etiquetas de negocios visibles + categorías en uso (chips de filtros). */
  filters: () =>
    http<{
      data: { tags: ExploreFilterItem[]; categories: ExploreFilterItem[] };
    }>('/explore/filters', { auth: true }),

  businesses: (params: {
    page: number;
    perPage?: number;
    search?: string;
    tagIds?: number[];
  }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      perPage: String(params.perPage ?? 20),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.tagIds?.length) query.set('tagIds', params.tagIds.join(','));

    return http<Paginated<ExploreBusiness>>(
      `/explore/organizationals?${query.toString()}`,
      { auth: true },
    );
  },

  /**
   * Búsqueda global de productos (home): matchea nombre/descripción del
   * producto Y nombre del negocio; cada item trae su `organizational`.
   */
  allProducts: (params: {
    page: number;
    perPage?: number;
    search?: string;
    categoryTypeId?: number;
  }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      perPage: String(params.perPage ?? 20),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.categoryTypeId) {
      query.set('categoryTypeId', String(params.categoryTypeId));
    }

    return http<Paginated<ExploreProduct>>(
      `/explore/products?${query.toString()}`,
      { auth: true },
    );
  },

  /** Detalle del negocio + las categorías que usan sus productos activos. */
  business: (id: number) =>
    http<{
      data: {
        organizational: ExploreBusiness;
        categories: ExploreFilterItem[];
      };
    }>(`/explore/organizationals/${id}`, { auth: true }),

  products: (
    organizationalId: number,
    params: {
      page: number;
      perPage?: number;
      search?: string;
      categoryTypeId?: number;
    },
  ) => {
    const query = new URLSearchParams({
      page: String(params.page),
      perPage: String(params.perPage ?? 20),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.categoryTypeId) {
      query.set('categoryTypeId', String(params.categoryTypeId));
    }

    return http<Paginated<ExploreProduct>>(
      `/explore/organizationals/${organizationalId}/products?${query.toString()}`,
      { auth: true },
    );
  },
};
