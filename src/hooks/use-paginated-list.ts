import { useCallback, useEffect, useRef, useState } from 'react';

import { PaginationMeta } from '@/components/ui/paginator';
import { Paginated } from '@/services/admin-users';

export type FetchMode = 'initial' | 'refresh' | 'page' | 'more';

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
 *
 * Además del paginador, soporta scroll infinito (feeds del cliente): el modo
 * `more` AGREGA la página siguiente en vez de reemplazar (`loadMore()`).
 *
 * `enabled: false` pospone la carga (queda en `loading`) hasta que pase a
 * true — para listas que dependen de un dato previo (coords de la dirección)
 * o que viven ocultas tras un toggle (feed de negocios del home): así no se
 * fetchea lo que no se va a mostrar.
 */
export function usePaginatedList<T>(
  fetcher: Fetcher<T>,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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
      if (mode === 'more') setLoadingMore(true);

      try {
        const res = await fetcher({ page, perPage, search: query });
        if (requestId !== requestIdRef.current) return; // respuesta vieja

        setItems((prev) => (mode === 'more' ? [...prev, ...res.data] : res.data));
        setMeta(res.pagination);
      } catch {
        // El interceptor HTTP ya mostró el error.
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
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
    if (!enabled) return;
    fetchPage(1, 'initial');
  }, [fetchPage, enabled]);

  /** Recarga la página actual (tras crear/editar/eliminar). */
  const reload = useCallback(
    () => fetchPage(meta?.page ?? 1, 'initial'),
    [fetchPage, meta?.page],
  );

  /** Scroll infinito: agrega la página siguiente si existe (onEndReached). */
  const loadMore = useCallback(() => {
    if (loading || refreshing || loadingMore) return;
    if (!meta?.hasNextPage) return;
    fetchPage(meta.page + 1, 'more');
  }, [fetchPage, loading, refreshing, loadingMore, meta]);

  return {
    items,
    meta,
    perPage,
    setPerPage,
    loading,
    refreshing,
    loadingMore,
    loadMore,
    search,
    setSearch,
    /** Búsqueda ya confirmada por el debounce (para textos de "sin resultados"). */
    query,
    fetchPage,
    reload,
  };
}
