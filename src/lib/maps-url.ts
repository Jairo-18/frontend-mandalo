import { DeviceCoords } from '@/lib/location';

/**
 * Patrones de coordenadas en URLs de Google Maps, por prioridad:
 * `!3d…!4d…` = pin del LUGAR (el bueno) · `?q=lat,lng` · `@lat,lng` = cámara
 * del mapa (aproximado). También acepta "lat, lng" pegado a mano.
 */
const COORD_PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /[?&]q=(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/,
];

function parseCoords(text: string): DeviceCoords | null {
  for (const pattern of COORD_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
      if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
        return { latitude, longitude };
      }
    }
  }
  return null;
}

/**
 * Saca las coordenadas de un link de Google Maps (el "Compartir" del negocio).
 * Los links compartidos (`maps.app.goo.gl`) vienen acortados: se sigue la
 * redirección con fetch y se parsea la URL final. Devuelve `null` si no se
 * pudo — quien llama muestra el mensaje.
 */
export async function extractCoordsFromMapsUrl(
  raw: string,
): Promise<DeviceCoords | null> {
  const url = raw.trim();
  if (!url) return null;

  const direct = parseCoords(url);
  if (direct) return direct;

  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(url)) {
    try {
      const res = await fetch(url);
      return parseCoords(res.url ?? '');
    } catch {
      return null;
    }
  }

  return null;
}
