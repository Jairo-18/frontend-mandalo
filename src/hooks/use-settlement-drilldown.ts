import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLiveRefresh } from '@/hooks/use-live-refresh';

import { SettlementPeriodType } from '@/services/admin-settlements';

type Level = 'year' | 'month' | 'quincena';

/**
 * Navegación año → mes → quincena compartida por las 3 pantallas de cobros
 * (§42): negocios, repartidores (admin) y "Mis pedidos" (repartidor). Mes y
 * año no son unidades guardadas — se piden al backend con ese `periodType` y
 * acá se FILTRAN al año/mes elegido (el backend ya las devuelve resumidas).
 *
 * Se mantiene al día sola (`useLiveRefresh`): antes cargaba solo al montar y,
 * como el drawer no desmonta la pantalla, los montos quedaban congelados
 * hasta cerrar sesión.
 */
export function useSettlementDrillDown<T extends { periodStart: string }>(
  fetcher: (periodType: SettlementPeriodType) => Promise<T[]>,
) {
  const [level, setLevel] = useState<Level>('year');
  const [year, setYear] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Solo la última petición pinta: una recarga lenta no pisa a la de otro nivel.
  const requestRef = useRef(0);

  /** `initial`: loader a pantalla completa; `refresh`: el del pull; `silent`: ninguno. */
  const load = useCallback(
    (lvl: Level, mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      const id = ++requestRef.current;
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      fetcher(lvl)
        .then((next) => {
          if (id === requestRef.current) setItems(next);
        })
        .catch(() => {
          // El interceptor HTTP ya mostró el error.
        })
        .finally(() => {
          if (id !== requestRef.current) return;
          setLoading(false);
          setRefreshing(false);
        });
    },
    [fetcher],
  );

  useEffect(() => {
    load(level);
  }, [level, load]);

  useLiveRefresh(useCallback(() => load(level, 'silent'), [level, load]));

  const visibleItems = useMemo(() => {
    if (level === 'year') return items;
    if (level === 'month') {
      return year ? items.filter((i) => i.periodStart.startsWith(year)) : [];
    }
    return month ? items.filter((i) => i.periodStart.startsWith(month)) : [];
  }, [items, level, year, month]);

  function drillInto(periodStart: string) {
    if (level === 'year') {
      setYear(periodStart.slice(0, 4));
      setLevel('month');
    } else if (level === 'month') {
      setMonth(periodStart.slice(0, 7));
      setLevel('quincena');
    }
  }

  function goBack() {
    if (level === 'quincena') {
      setLevel('month');
      setMonth(null);
    } else if (level === 'month') {
      setLevel('year');
      setYear(null);
    }
  }

  return {
    level,
    year,
    month,
    items: visibleItems,
    loading,
    refreshing,
    drillInto,
    goBack,
    refresh: () => load(level, 'refresh'),
  };
}
