import { useEffect, useSyncExternalStore } from 'react';

import { useSession } from '@/hooks/use-session';
import { toast } from '@/lib/toast';
import { FavoriteKind, favoritesService } from '@/services/favorites';

/**
 * Favoritos del usuario (corazones de tarjetas, detalle y cabecera de la
 * tienda): store de módulo COMPARTIDO por todas las pantallas, con los ids
 * que devuelve `/favorite/ids` (una sola petición por sesión). Marcar o
 * quitar es optimista: el corazón cambia al instante y, si el backend falla,
 * vuelve atrás con un aviso.
 */
type Snapshot = {
  business: ReadonlySet<number>;
  product: ReadonlySet<number>;
  /** Ya llegaron los ids del backend (antes de eso, "vacío" no significa nada). */
  loaded: boolean;
  /**
   * Contador de cambios confirmados por tipo: "Mis favoritos" solo vuelve a
   * pedir la lista cuando esto cambia (no en cada visita ni cambio de pestaña).
   */
  changes: { business: number; product: number };
};

const EMPTY: Snapshot = {
  business: new Set(),
  product: new Set(),
  loaded: false,
  changes: { business: 0, product: 0 },
};

let snapshot: Snapshot = EMPTY;
let loadedFor: string | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setSnapshot(next: Snapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Snapshot {
  return snapshot;
}

/** Carga los ids una vez por usuario (el cambio de cuenta los recarga). */
function ensureLoaded(userId: string): void {
  if (loadedFor === userId || loading) return;
  loading = favoritesService
    .ids()
    .then((res) => {
      loadedFor = userId;
      setSnapshot({
        business: new Set(res.data.businessIds),
        product: new Set(res.data.productIds),
        loaded: true,
        changes: snapshot.changes,
      });
    })
    .catch(() => {
      // Sin ids los corazones salen vacíos; se reintenta en la próxima montada.
    })
    .finally(() => {
      loading = null;
    });
}

/** Al cerrar sesión (ver `signOutEverywhere`). */
export function clearFavorites(): void {
  loadedFor = null;
  setSnapshot(EMPTY);
}

function withId(set: ReadonlySet<number>, id: number, on: boolean): Set<number> {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

/** Marca/quita (optimista). Devuelve el nuevo estado. */
export async function toggleFavorite(kind: FavoriteKind, id: number): Promise<boolean> {
  const on = !snapshot[kind].has(id);
  setSnapshot({ ...snapshot, [kind]: withId(snapshot[kind], id, on) });
  try {
    await favoritesService.set(kind, id, on);
    setSnapshot({
      ...snapshot,
      changes: { ...snapshot.changes, [kind]: snapshot.changes[kind] + 1 },
    });
    if (on) toast.success('Guardado en favoritos');
    return on;
  } catch {
    // Vuelve atrás (el interceptor ya mostró el error).
    setSnapshot({ ...snapshot, [kind]: withId(snapshot[kind], id, !on) });
    return !on;
  }
}

/** Ids favoritos reactivos (vacíos para el invitado). */
export function useFavorites(): Snapshot {
  const userId = useSession()?.user?.id ?? null;
  useEffect(() => {
    if (userId) ensureLoaded(userId);
  }, [userId]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
