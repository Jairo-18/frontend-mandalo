import { File, Paths } from 'expo-file-system';

import { getSession } from '@/lib/session';
import { ExploreFilterItem, exploreService } from '@/services/explore';
import { UserAddress, userAddressesService } from '@/services/user-addresses';

export type ExploreFilters = {
  tags: ExploreFilterItem[];
  categories: ExploreFilterItem[];
};

/**
 * Caché de datos del usuario autenticado (stale-while-revalidate, mismo
 * espíritu que `catalog-cache.ts`): direcciones y filtros del explorar. Las
 * pantallas leen al instante lo cacheado (memoria, sembrada desde disco) y el
 * store revalida contra el backend como mucho una vez por TTL — nada de
 * refetch en cada montada. Las mutaciones (crear/editar dirección…) fuerzan
 * el refresh y TODAS las pantallas suscritas se enteran.
 *
 * El caché es POR USUARIO: se guarda con el userId y se descarta si la sesión
 * cambia (y se borra al cerrar sesión, ver `signOutEverywhere`).
 *
 * La tarifa de domicilio NO se cachea acá (§42): es por distancia
 * negocio↔dirección, no un dato global — el checkout la pide en vivo con
 * `ordersService.deliveryFee()`.
 */
type DiskCache = {
  userId: string;
  addresses: UserAddress[] | null;
  filters: ExploreFilters | null;
  savedAt: string;
};

const FILE_NAME = 'user-data-cache.json';

type Key = 'addresses' | 'filters';

/** Cada cuánto se revalida contra el backend (si nadie fuerza antes). */
const TTL_MS: Record<Key, number> = {
  addresses: 5 * 60_000, // solo cambian desde esta app → mutaciones fuerzan
  filters: 10 * 60_000, // tags/categorías del explorar
};

const data: {
  addresses: UserAddress[] | null;
  filters: ExploreFilters | null;
} = { addresses: null, filters: null };

const fetchedAt: Record<Key, number> = {
  addresses: 0,
  filters: 0,
};
/** Ya hubo al menos un intento de fetch (para que `loading` no sea eterno si falla). */
const settled: Record<Key, boolean> = {
  addresses: false,
  filters: false,
};
const inFlight: Partial<Record<Key, Promise<void>>> = {};

let hydratedFor: string | null = null;
let version = 0;
const listeners = new Set<() => void>();

function notify(): void {
  version++;
  listeners.forEach((listener) => listener());
}

export function subscribeUserData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Snapshot estable para useSyncExternalStore (cambia con cada notify). */
export function getUserDataVersion(): number {
  return version;
}

/** Siembra la memoria desde el disco la primera vez (o si cambió de cuenta). */
function ensureHydrated(): void {
  const userId = getSession()?.user.id;
  if (!userId || hydratedFor === userId) return;

  data.addresses = null;
  data.filters = null;
  fetchedAt.addresses = fetchedAt.filters = 0;
  settled.addresses = settled.filters = false;
  hydratedFor = userId;

  try {
    const file = new File(Paths.cache, FILE_NAME);
    if (!file.exists) return;
    const parsed = JSON.parse(file.textSync()) as DiskCache;
    // Caché de OTRA cuenta: se ignora (se sobreescribe al persistir).
    if (parsed.userId !== userId) return;
    data.addresses = Array.isArray(parsed.addresses) ? parsed.addresses : null;
    data.filters = parsed.filters ?? null;
  } catch {
    // Sin file system (web) o JSON corrupto → se llena desde el backend.
  }
}

function persist(): void {
  if (!hydratedFor) return;
  try {
    const file = new File(Paths.cache, FILE_NAME);
    const cache: DiskCache = {
      userId: hydratedFor,
      addresses: data.addresses,
      filters: data.filters,
      savedAt: new Date().toISOString(),
    };
    file.write(JSON.stringify(cache));
  } catch {
    // Sin file system → la app funciona igual, solo sin caché.
  }
}

/** Revalida un dato si venció el TTL (o siempre, con `force`). Deduplica. */
function revalidate<T>(
  key: Key,
  force: boolean,
  fetcher: () => Promise<T>,
  assign: (value: T) => void,
): Promise<void> {
  ensureHydrated();
  if (!getSession()) return Promise.resolve();

  const fresh = Date.now() - fetchedAt[key] < TTL_MS[key];
  if (!force && fresh && data[key] !== null) {
    return inFlight[key] ?? Promise.resolve();
  }
  if (inFlight[key]) return inFlight[key]!;

  const promise = fetcher()
    .then((value) => {
      assign(value);
      fetchedAt[key] = Date.now();
      persist();
    })
    .catch(() => {
      // El interceptor HTTP ya mostró el error; se conserva lo cacheado.
    })
    .finally(() => {
      settled[key] = true;
      delete inFlight[key];
      notify();
    });
  inFlight[key] = promise;
  return promise;
}

// ---------- direcciones ----------

export function getAddresses(): UserAddress[] | null {
  ensureHydrated();
  return data.addresses;
}

export function isAddressesLoading(): boolean {
  ensureHydrated();
  return data.addresses === null && !settled.addresses;
}

export function refreshAddresses(force = false): Promise<void> {
  return revalidate(
    'addresses',
    force,
    async () => (await userAddressesService.list()).data,
    (value) => {
      data.addresses = value;
    },
  );
}

// ---------- filtros del explorar (tags + categorías) ----------

export function getExploreFilters(): ExploreFilters | null {
  ensureHydrated();
  return data.filters;
}

export function refreshExploreFilters(force = false): Promise<void> {
  return revalidate(
    'filters',
    force,
    async () => (await exploreService.filters()).data,
    (value) => {
      data.filters = value;
    },
  );
}

// ---------- limpieza (cierre de sesión) ----------

export function clearUserData(): void {
  hydratedFor = null;
  data.addresses = null;
  data.filters = null;
  fetchedAt.addresses = fetchedAt.filters = 0;
  settled.addresses = settled.filters = false;
  try {
    new File(Paths.cache, FILE_NAME).delete();
  } catch {
    // Sin archivo o sin fs: nada que borrar.
  }
  notify();
}
