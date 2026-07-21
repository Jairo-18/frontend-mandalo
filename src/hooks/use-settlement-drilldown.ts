import { useCallback, useEffect, useMemo, useState } from 'react';

import { SettlementPeriodType } from '@/services/admin-settlements';

type Level = 'year' | 'month' | 'quincena';

/**
 * Navegación año → mes → quincena compartida por las 3 pantallas de cobros
 * (§42): negocios, repartidores (admin) y "Mis pedidos" (repartidor). Mes y
 * año no son unidades guardadas — se piden al backend con ese `periodType` y
 * acá se FILTRAN al año/mes elegido (el backend ya las devuelve resumidas).
 */
export function useSettlementDrillDown<T extends { periodStart: string }>(
  fetcher: (periodType: SettlementPeriodType) => Promise<T[]>,
) {
  const [level, setLevel] = useState<Level>('year');
  const [year, setYear] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (lvl: Level) => {
      setLoading(true);
      fetcher(lvl)
        .then(setItems)
        .catch(() => {
          // El interceptor HTTP ya mostró el error.
        })
        .finally(() => setLoading(false));
    },
    [fetcher],
  );

  useEffect(() => {
    load(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, load]);

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
    drillInto,
    goBack,
    refresh: () => load(level),
  };
}
