import { deviceStoreDelete, deviceStoreGet, deviceStoreSet } from '@/lib/device-store';
import { DeviceCoords } from '@/lib/location';

/**
 * Ubicación MANUAL del repartidor para "Disponibles" (reemplaza su GPS real
 * al buscar pedidos cerca): mientras la app está en pruebas, deja simular
 * estar en otra ciudad/zona sin depender de la posición real del
 * dispositivo. Persistida por dispositivo — sigue activa entre aperturas de
 * la app hasta que el repartidor la quite.
 */
const KEY = 'mandalo:delivery-location-override';

export type DeliveryLocationOverride = {
  coords: DeviceCoords;
  /** Texto para mostrar en la pastilla ("Nueva York", la dirección, etc.). */
  label: string;
};

export async function getDeliveryLocationOverride(): Promise<DeliveryLocationOverride | null> {
  const raw = await deviceStoreGet(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DeliveryLocationOverride;
  } catch {
    return null;
  }
}

export async function setDeliveryLocationOverride(
  value: DeliveryLocationOverride,
): Promise<void> {
  await deviceStoreSet(KEY, JSON.stringify(value));
}

export async function clearDeliveryLocationOverride(): Promise<void> {
  await deviceStoreDelete(KEY);
}
