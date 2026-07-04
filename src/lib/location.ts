import * as Location from 'expo-location';

import { toast } from '@/lib/toast';

export type DeviceCoords = { latitude: number; longitude: number };

export type DeviceLocation = {
  coords: DeviceCoords;
  /** Dirección legible (geocoding inverso); puede faltar si el geocoder falla. */
  address?: string;
};

/**
 * Pide permiso de ubicación, toma la posición GPS actual y la convierte en una
 * dirección legible con el geocodificador nativo (sin API keys). Devuelve
 * `null` si el usuario negó el permiso o no se pudo obtener la posición (el
 * toast ya se mostró acá). Las coordenadas van al backend (`user.latitude/
 * longitude`); el texto solo prellena el campo de dirección (editable).
 */
/** Rechaza si la promesa no resuelve en `ms` (el GPS puede quedarse colgado). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('location timeout')), ms),
    ),
  ]);
}

export async function getDeviceLocation(): Promise<DeviceLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    toast.error('Necesitamos permiso de ubicación para marcar tu dirección.');
    return null;
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    toast.error('Activa la ubicación (GPS) del dispositivo e inténtalo de nuevo.');
    return null;
  }

  // Posición actual con timeout; si el GPS no da fix (típico en emulador o
  // bajo techo), cae a la última posición conocida por el sistema.
  let position: Location.LocationObject | null = null;
  try {
    position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      10000,
    );
  } catch {
    position = await Location.getLastKnownPositionAsync();
  }

  if (!position) {
    toast.error(
      'No pudimos obtener tu ubicación. Revisa que el GPS esté activo e inténtalo de nuevo.',
    );
    return null;
  }

  const coords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };

  let address: string | undefined;
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (place) {
      address =
        [place.street || place.name, place.city || place.subregion]
          .filter(Boolean)
          .join(', ') || undefined;
    }
  } catch {
    // Sin red el geocoder puede fallar: las coordenadas igual sirven.
  }

  return { coords, address };
}
