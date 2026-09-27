import * as Location from 'expo-location';

import { ensureLocationConsent } from '@/lib/location-consent';
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

/**
 * Centro inicial de CUALQUIER mapa cuando no hay ubicación previa ni ha llegado
 * el GPS todavía (selector de direcciones del cliente y de ubicación de
 * negocios del admin, nativo y web).
 *
 * Son las coordenadas de la cabecera de Mocoa. Antes cada selector tenía su
 * propia copia de `1.0865, -76.6325`, un punto rural a medio camino entre Mocoa
 * (~6,9 km) y Villagarzón (~6,7 km): el mapa abría sobre un potrero y, como
 * caía 250 m más cerca de Villagarzón, el selector anunciaba "Villagarzón"
 * aunque el usuario estuviera en Mocoa. Ese mismo punto es el que aparecía
 * escrito como "Ubicación (1.08650, -76.63250)".
 */
export const DEFAULT_MAP_CENTER: DeviceCoords = { latitude: 1.1466, longitude: -76.6482 };

/** Más lejos de esto de TODAS las cabeceras = fuera del área de operación. */
const NEAREST_SEAT_MAX_KM = 80;

/** Departamento donde opera la app: todas las cabeceras de arriba son suyas. */
const OPERATING_REGION = 'Putumayo';

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
    ? { name: best.name, region: OPERATING_REGION }
    : null;
}

/**
 * Detecta un Google Plus Code ("49P2+V6", "67Q5 49P2+V6"): alfabeto base-20
 * propio del formato + el '+' obligatorio antes de los últimos 2-3 caracteres.
 */
/**
 * Vía + número de placa. El geocoder los devuelve SEPARADOS (`street` =
 * "Carrera 7", `streetNumber` = "5-30"), y quedarse solo con `street` deja al
 * domiciliario con "Carrera 7, Mocoa": la cuadra entera. El texto se muestra
 * en la tarjeta del pedido, en el detalle y como descripción del pin en su
 * mapa, así que el número es justo lo que le falta para dar con la puerta.
 */
function streetWithNumber(place: Location.LocationGeocodedAddress): string | undefined {
  const street = place.street?.trim();
  if (!street) return undefined;
  const number = place.streetNumber?.trim();
  if (!number) return street;
  // Formato colombiano ("Carrera 7 #5-30"), sin duplicar el '#' si ya viene.
  return number.startsWith('#') ? `${street} ${number}` : `${street} #${number}`;
}

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
  return normalizePlaceName(a) === normalizePlaceName(b);
}

/** Sin tildes, sin espacios de sobra y en minúsculas. */
function normalizePlaceName(s: string): string {
  return Array.from(s.normalize('NFD'))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join('')
    .trim()
    .toLowerCase();
}

/**
 * ¿El geocoder ubicó el punto en OTRO departamento? `false` si no respondió.
 *
 * Compara por INCLUSIÓN, no por igualdad: Google envuelve el nombre según el
 * idioma del dispositivo ("Putumayo Department", "Departamento del Putumayo"),
 * y exigir igualdad exacta daría "otro departamento" estando en el Putumayo —
 * apagando justo el snap que corrige a Google dentro del área de operación.
 */
function isOutsideOperatingRegion(region?: string): boolean {
  if (!region) return false;
  return !normalizePlaceName(region).includes(normalizePlaceName(OPERATING_REGION));
}

/**
 * Posición actual SIN toasts ni geocoding (para los filtros por cercanía:
 * pedidos disponibles del repartidor). Pide el permiso del sistema si hace
 * falta; devuelve `null` si lo niegan o no hay fix — quien llama decide el
 * fallback (mostrar sin filtrar).
 */
export async function getDeviceCoordsSilently(): Promise<DeviceCoords | null> {
  try {
    await ensureLocationConsent();
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

/**
 * Dirección legible para unas coordenadas YA conocidas (geocoding inverso +
 * snap al municipio de operación más cercano) — la misma lógica que arma el
 * texto en `getDeviceLocation`, pero reusable para cualquier punto (p. ej. el
 * pin que el usuario mueve a mano en `AddressMapPicker`, no solo su GPS).
 */
export async function reverseGeocodeCoords(
  coords: DeviceCoords,
): Promise<{ address?: string; region?: string; city?: string }> {
  let streetLine: string | undefined;
  let region: string | undefined;
  let city: string | undefined;
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (place) {
      // Cuando el punto no tiene dirección con nombre, Google devuelve un
      // Plus Code ("49P2+V6") como `name` — se descarta (mejor el barrio o
      // el fallback "Ubicación GPS (lat, lng)" del caller).
      const name = isPlusCode(place.name) ? undefined : place.name;
      streetLine = streetWithNumber(place) || name || place.district || undefined;
      region = place.region ?? undefined;
      city = place.city ?? place.subregion ?? undefined;
    }
  } catch {
    // Sin red el geocoder puede fallar: las coordenadas igual sirven.
  }

  // Municipio/departamento por DISTANCIA al punto dentro del área de
  // operación; el nombre del geocoder queda solo como fallback fuera de ella
  // (Google marcaba "Villagarzón" estando en Mocoa).
  //
  // Pero ese snap existe para corregir a Google DENTRO del Putumayo, no para
  // anexarle los departamentos vecinos: `NEAREST_SEAT_MAX_KM` son 80 km y
  // varias cabeceras están pegadas a la frontera — Pasto (Nariño) queda a
  // ~32 km de Santiago, así que sin esta guarda alguien en Pasto se registraba
  // como "Santiago, Putumayo". Si el geocoder respondió y dice otro
  // departamento, le creemos a él. Cuando no respondió (`region` vacío, el caso
  // rural sin red) el snap actúa igual que siempre.
  const nearest = isOutsideOperatingRegion(region) ? null : nearestMunicipality(coords);
  if (nearest) {
    city = nearest.name;
    region = nearest.region;
  }

  // El texto NO depende de que el geocoder haya respondido. En el Putumayo
  // rural `reverseGeocodeAsync` devuelve vacío a menudo (sin calles con nombre,
  // o sin red), y antes eso descartaba también el municipio que `nearest` ya
  // había resuelto por pura distancia, offline: el registro terminaba
  // escribiendo "Ubicación (1.08650, -76.63250)" y el mapa confirmaba
  // `undefined` pese a estar MOSTRANDO el municipio en pantalla.
  //
  // Ahora el peor caso es el municipio más cercano ("Mocoa", "Villagarzón", el
  // que toque), y si el punto cae fuera del área de operación `city` sigue
  // vacío y el caller usa su propio fallback de coordenadas, igual que antes.
  const address = [streetLine, city].filter(Boolean).join(', ') || undefined;

  return { address, region, city };
}

export async function getDeviceLocation(): Promise<DeviceLocation | null> {
  await ensureLocationConsent();

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

  const { address, region, city } = await reverseGeocodeCoords(coords);

  return { coords, address, region, city };
}
