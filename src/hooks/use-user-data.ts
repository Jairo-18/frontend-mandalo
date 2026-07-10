import { useEffect, useSyncExternalStore } from 'react';

import {
  getAddresses,
  getDeliveryFee,
  getExploreFilters,
  isAddressesLoading,
  refreshAddresses,
  refreshDeliveryFee,
  refreshExploreFilters,
  subscribeUserData,
} from '@/lib/user-data';

/**
 * Hooks del caché de datos del usuario (`lib/user-data.ts`): devuelven lo
 * cacheado AL INSTANTE y revalidan en segundo plano respetando el TTL — usar
 * estos en vez de fetchear los services en cada pantalla.
 *
 * ⚠️ El snapshot de useSyncExternalStore debe SER el dato (no un contador de
 * versión leído aparte): con React Compiler activo, leer el store con una
 * función suelta durante el render hace que el compilador memoice el JSX
 * viejo y la pantalla no refleje la llegada de los datos (bug del loader
 * infinito del chip de dirección, 2026-07-09). Los getters devuelven
 * referencias estables hasta que el dato cambia, así que son snapshots válidos.
 */

/** Direcciones del usuario, con la principal resuelta. */
export function useUserAddresses() {
  const addresses = useSyncExternalStore(subscribeUserData, getAddresses);
  const loading = useSyncExternalStore(subscribeUserData, isAddressesLoading);
  useEffect(() => {
    void refreshAddresses();
  }, []);

  return {
    addresses: addresses ?? [],
    defaultAddress: addresses?.find((a) => a.isDefault),
    /** true solo mientras no hay NADA que mostrar (ni caché ni respuesta). */
    loading,
  };
}

/** Tarifa fija del domicilio (checkout). */
export function useDeliveryFee() {
  const fee = useSyncExternalStore(subscribeUserData, getDeliveryFee);
  useEffect(() => {
    void refreshDeliveryFee();
  }, []);

  return fee ?? 0;
}

/** Tags + categorías del explorar (home). */
export function useExploreFilters() {
  const filters = useSyncExternalStore(subscribeUserData, getExploreFilters);
  useEffect(() => {
    void refreshExploreFilters();
  }, []);

  return {
    tags: filters?.tags ?? [],
    categories: filters?.categories ?? [],
  };
}
