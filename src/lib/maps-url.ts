import { DeviceCoords } from '@/lib/location';
import { mapsService } from '@/services/maps';

/**
 * Patrones de coordenadas en URLs de Google Maps, por prioridad:
 * `!3d…!4d…` = pin del LUGAR (el bueno) · `?q=lat,lng` · `?ll=lat,lng`
 * (formato viejo) · `/place/lat,lng` (pin sin nombre) · `@lat,lng` = cámara
 * del mapa (aproximado). También acepta "lat, lng" pegado a mano.
 */
const COORD_PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /[?&]q=(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  /[?&]ll=(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  /\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/,
];

/** Hosts de acortadores de Google que SÍ se resuelven (nunca cualquier link). */
const SHORT_LINK_HOSTS = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl|g\.co)\//i;

function parseCoords(text: string): DeviceCoords | null {
  // Los links a veces llegan URL-encoded (p. ej. "%2C" en vez de ","),
  // sobre todo cuando vienen pegados dentro de OTRO link. Se intenta con el
  // texto decodificado primero, y si falla (o el decode explota con una URL
  // "casi" válida) se cae al texto crudo.
  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    // Sigue con el texto crudo.
  }
  for (const candidate of [decoded, text]) {
    for (const pattern of COORD_PATTERNS) {
      const match = candidate.match(pattern);
      if (match) {
        const latitude = parseFloat(match[1]);
        const longitude = parseFloat(match[2]);
        if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
          return { latitude, longitude };
        }
      }
    }
  }
  return null;
}

/**
 * Normaliza lo que el usuario pegó: quita texto suelto alrededor del link
 * ("Mi negocio: https://maps.app.goo.gl/xyz") y le agrega el protocolo si
 * pegó el dominio a secas ("maps.app.goo.gl/xyz").
 */
function normalizeInput(raw: string): string {
  const trimmed = raw.trim();
  const embedded = trimmed.match(/https?:\/\/\S+/);
  if (embedded) return embedded[0];
  if (/^-?\d/.test(trimmed)) return trimmed; // "lat, lng" a mano
  if (/^[\w-]+(\.[\w-]+)+\/\S+/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

/**
 * Saca las coordenadas de un link de Google Maps (el "Compartir" del negocio,
 * en cualquiera de sus formatos: acortado, largo, con o sin nombre de lugar).
 * Los links acortados (`maps.app.goo.gl`, `goo.gl`, `g.co`) no traen
 * coordenadas en la URL — hay que seguir la redirección para verlas. Eso NO
 * se puede hacer desde el navegador (versión web): Google no manda
 * `Access-Control-Allow-Origin`, así que un `fetch` directo del cliente
 * falla por CORS y el link "se rechaza" aunque sea válido. Por eso la
 * redirección se resuelve del lado del backend (`/organizational/resolve-maps-url`).
 * Devuelve `null` si no se pudo — quien llama muestra el mensaje.
 */
export async function extractCoordsFromMapsUrl(
  raw: string,
): Promise<DeviceCoords | null> {
  const url = normalizeInput(raw);
  if (!url) return null;

  const direct = parseCoords(url);
  if (direct) return direct;

  if (SHORT_LINK_HOSTS.test(url)) {
    try {
      const res = await mapsService.resolveMapsUrl(url);
      return res.data.finalUrl ? parseCoords(res.data.finalUrl) : null;
    } catch {
      return null;
    }
  }

  return null;
}
