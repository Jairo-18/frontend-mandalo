import { http } from '@/lib/http';
import { Paginated } from '@/services/admin-users';

/** Item de un catálogo simple (categorías de producto y etiquetas de negocio). */
export type CatalogItem = {
  id: number;
  code: string;
  name: string;
  icon: string | null;
};

export type CatalogItemPayload = {
  code: string;
  name: string;
  /** `null` limpia el icono al editar. */
  icon?: string | null;
};

export type CatalogCrudService = ReturnType<typeof makeCatalogCrudService>;

/**
 * Los endpoints de `/category-type` y `/tag` son espejo (create, paginated,
 * patch, delete con JWT), así que el CRUD del panel admin se genera una sola
 * vez por ruta base.
 */
function makeCatalogCrudService(basePath: '/category-type' | '/tag') {
  return {
    paginated: (params: { page: number; perPage?: number; search?: string }) => {
      const query = new URLSearchParams({
        page: String(params.page),
        perPage: String(params.perPage ?? 20),
        order: 'ASC',
      });
      if (params.search?.trim()) query.set('search', params.search.trim());

      return http<Paginated<CatalogItem>>(
        `${basePath}/paginated?${query.toString()}`,
        { auth: true },
      );
    },

    create: (payload: CatalogItemPayload) =>
      http<{ data: { rowId: number } }>(`${basePath}/create`, {
        method: 'POST',
        body: payload,
        auth: true,
        toastSuccess: true,
      }),

    update: (id: number, payload: Partial<CatalogItemPayload>) =>
      http<{ message?: string }>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
        auth: true,
        toastSuccess: true,
      }),

    remove: (id: number) =>
      http<{ message?: string }>(`${basePath}/${id}`, {
        method: 'DELETE',
        auth: true,
        toastSuccess: true,
      }),
  };
}

export const adminCategoriesService = makeCatalogCrudService('/category-type');
export const adminTagsService = makeCatalogCrudService('/tag');
