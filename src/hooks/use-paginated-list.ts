import { useCallback, useEffect, useRef, useState } from 'react';

import { PaginationMeta } from '@/components/ui/paginator';
import { Paginated } from '@/services/admin-users';

export type FetchMode = 'initial' | 'refresh' | 'page';

type Fetcher<T> = (params: {
  page: number;
  perPage: number;
  search: string;
}) => Promise<Paginated<T>>;

/**
 * Estado compartido de los listados paginados del panel (usuarios, negocios,
 * catálogos, productos): búsqueda con debounce de 400 ms, descarte de
 * respuestas viejas por contador de petición, paginador y pull-to-refresh.
 *
 * El `fetcher` debe venir memoizado (useCallback): cuando cambia (búsqueda
 * confirmada, filtros, tamaño de página) se recarga solo desde la página 1.
 */
export function usePaginatedList<T>(fetcher: Fetcher<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // Contador de petición para descartar respuestas viejas (p. ej. si el
  // usuario sigue escribiendo en la búsqueda).
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (page: number, mode: FetchMode) => {
      const requestId = ++requestIdRef.current;
      if (mode === 'initial' || mode === 'page') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);

      try {
        const res = await fetcher({ page, perPage, search: query });
        if (requestId !== requestIdRef.current) return; // respuesta vieja

        setItems(res.data);
        setMeta(res.pagination);
      } catch {
        // El interceptor HTTP ya mostró el error.
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetcher, query, perPage],
  );

  // Debounce de la búsqueda: se consulta 400 ms después de dejar de escribir.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Carga inicial y recarga cuando cambian búsqueda confirmada/filtros/perPage.
  useEffect(() => {
    fetchPage(1, 'initial');
  }, [fetchPage]);

  /** Recarga la página actual (tras crear/editar/eliminar). */
  const reload = useCallback(
    () => fetchPage(meta?.page ?? 1, 'initial'),
    [fetchPage, meta?.page],
  );

  return {
    items,
    meta,
    perPage,
    setPerPage,
    loading,
    refreshing,
    search,
    setSearch,
    /** Búsqueda ya confirmada por el debounce (para textos de "sin resultados"). */
    query,
    fetchPage,
    reload,
  };
}
