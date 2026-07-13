import * as Location from 'expo-location';

import { toast } from '@/lib/toast';

export type DeviceCoords = { latitude: number; longitude: number };

export type DeviceLocation = {
  coords: DeviceCoords;
  /** Dirección legible (geocoding inverso); puede faltar si el geocoder falla. */
  address?: string;
  /** Departamento según el geocoder (p. ej. "Putumayo") — para preselects. */
  region?: string;
  /** Municipio/ciudad según el geocoder (p. ej. "Villagarzón"). */
  city?: string;
};

/**
 * Pide permiso de ubicación, toma la posición GPS actual y la convierte en una
 * dirección legible con el geocodificador nativo (sin API keys). Devuelve
 * `null` si el usuario negó el permiso o no se pudo obtener la posición (el
 * toast ya se mostró acá). Las coordenadas van al backend (`user.latitude/
 * longitude`); el texto solo prellena el campo de dirección (editable).
 */
/**
 * Cabeceras municipales del Putumayo (el área donde opera la app) con su
 * coordenada aproximada. El municipio se resuelve por DISTANCIA a la posición
 * real del dispositivo — NO por el nombre que devuelva el geocoder de Google,
 * que en puntos sin dirección con nombre cuelga el resultado del pueblo
 * prominente más cercano en SUS datos (marcaba "Villagarzón" estando en
 * Mocoa). Los nombres son los del catálogo DANE: el preselect de los selects
 * matchea por nombre con `samePlaceName`.
 */
const PUTUMAYO_SEATS: Array<{ name: string } & DeviceCoords> = [
  { name: 'Mocoa', latitude: 1.1466, longitude: -76.6482 },
  { name: 'Villagarzón', latitude: 1.0287, longitude: -76.6167 },
  { name: 'Puerto Guzmán', latitude: 0.9631, longitude: -76.4076 },
  { name: 'Puerto Caicedo', latitude: 0.6879, longitude: -76.6069 },
  { name: 'Puerto Asís', latitude: 0.5052, longitude: -76.4956 },
  { name: 'Orito', latitude: 0.665, longitude: -76.873 },
  { name: 'Valle del Guamuez', latitude: 0.4225, longitude: -76.9053 },
  { name: 'San Miguel', latitude: 0.3436, longitude: -76.911 },
  { name: 'Puerto Leguízamo', latitude: -0.1934, longitude: -74.7817 },
  { name: 'Sibundoy', latitude: 1.2003, longitude: -76.9187 },
  { name: 'San Francisco', latitude: 1.174, longitude: -76.878 },
  { name: 'Colón', latitude: 1.19, longitude: -76.973 },
  { name: 'Santiago', latitude: 1.146, longitude: -77.002 },
];

/** Más lejos de esto de TODAS las cabeceras = fuera del área de operación. */
const NEAREST_SEAT_MAX_KM = 80;

/** Distancia haversine en kilómetros (igual que el backend para las ETAs). */
function distanceKm(a: DeviceCoords, b: DeviceCoords): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Municipio del área de operación más cercano a las coordenadas; `null` si el
 * dispositivo está lejos de todas las cabeceras (ahí decide el geocoder).
 */
export function nearestMunicipality(
  coords: DeviceCoords,
): { name: string; region: string } | null {
  let best: (typeof PUTUMAYO_SEATS)[number] | null = null;
  let bestKm = Infinity;
  for (const seat of PUTUMAYO_SEATS) {
    const km = distanceKm(coords, seat);
    if (km < bestKm) {
      bestKm = km;
      best = seat;
    }
  }
  return best && bestKm <= NEAREST_SEAT_MAX_KM
    ? { name: best.name, region: 'Putumayo' }
    : null;
}

/**
 * Detecta un Google Plus Code ("49P2+V6", "67Q5 49P2+V6"): alfabeto base-20
 * propio del formato + el '+' obligatorio antes de los últimos 2-3 caracteres.
 */
function isPlusCode(value?: string | null): boolean {
  if (!value) return false;
  return /^(?:[23456789CFGHJMPQRVWX]{4,8}\s)?[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}$/i.test(
    value.trim(),
  );
}

/** Rechaza si la promesa no resuelve en `ms` (el GPS puede quedarse colgado). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('location timeout')), ms),
    ),
  ]);
}

/**
 * Compara nombres de lugar sin tildes ni mayúsculas ("Mocoa" = "mocoa ") —
 * para matchear region/city del geocoder contra los catálogos DANE. NFD
 * separa la tilde de la letra y se filtran las marcas combinantes por código.
 */
export function samePlaceName(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const clean = (s: string) =>
    Array.from(s.normalize('NFD'))
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return code < 0x0300 || code > 0x036f;
      })
      .join('')
      .trim()
      .toLowerCase();
  return clean(a) === clean(b);
}

/**
 * Posición actual SIN toasts ni geocoding (para los filtros por cercanía:
 * pedidos disponibles del repartidor). Pide el permiso del sistema si hace
 * falta; devuelve `null` si lo niegan o no hay fix — quien llama decide el
 * fallback (mostrar sin filtrar).
 */
export async function getDeviceCoordsSilently(): Promise<DeviceCoords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    if (!(await Location.hasServicesEnabledAsync())) return null;

    let position: Location.LocationObject | null = null;
    try {
      position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        10000,
      );
    } catch {
      // Reciente o nada: filtrar "cerca de mí" con una posición vieja engaña.
      position = await Location.getLastKnownPositionAsync({
        maxAge: 10 * 60_000,
      });
    }

    return position
      ? {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
      : null;
  } catch {
    return null;
  }
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
  // bajo techo), cae a la última posición conocida por el sistema — pero solo
  // si es reciente: una posición vieja marcaría dirección/municipio de donde
  // ESTUVO el dispositivo, no de donde está.
  let position: Location.LocationObject | null = null;
  try {
    position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      10000,
    );
  } catch {
    position = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
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

  // Calle/barrio legible del geocoder (solo para el TEXTO de la dirección).
  let streetLine: string | undefined;
  let region: string | undefined;
  let city: string | undefined;
  let geocoded = false;
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (place) {
      geocoded = true;
      // Cuando el punto no tiene dirección con nombre, Google devuelve un
      // Plus Code ("49P2+V6") como `name` — se descarta (mejor el barrio o
      // el fallback "Ubicación GPS (lat, lng)" del caller).
      const name = isPlusCode(place.name) ? undefined : place.name;
      streetLine = place.street || name || place.district || undefined;
      region = place.region ?? undefined;
      city = place.city ?? place.subregion ?? undefined;
    }
  } catch {
    // Sin red el geocoder puede fallar: las coordenadas igual sirven.
  }

  // Municipio/departamento por DISTANCIA a la posición del dispositivo dentro
  // del área de operación; el nombre del geocoder queda solo como fallback
  // fuera de ella (Google marcaba "Villagarzón" estando en Mocoa).
  const nearest = nearestMunicipality(coords);
  if (nearest) {
    city = nearest.name;
    region = nearest.region;
  }

  const address = geocoded
    ? [streetLine, city].filter(Boolean).join(', ') || undefined
    : undefined;

  return { coords, address, region, city };
}
