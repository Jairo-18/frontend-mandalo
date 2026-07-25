/**
 * Utilidades de color para la paleta dinámica del admin (§50): conversión
 * hex↔HSL para derivar tonos (variante oscura de surface/muted, primary-soft/
 * primary-tint a partir de primary) sin que el admin tenga que elegir 10
 * colores — solo elige 4 (primary, dark, muted, surface) y el resto sale solo.
 */

type Rgb = [number, number, number];
type Hsl = [number, number, number];

/**
 * Si `hex` viene mal formado (o `undefined` — pasó de verdad con un caché
 * viejo en disco, ver NOTAS.md §51), cae a negro en vez de tronar toda la
 * app: esto corre en el primer render, antes de cualquier pantalla de error.
 */
function hexToRgb(hex: string): Rgb {
  const clean = typeof hex === 'string' ? hex.replace('#', '') : '';
  if (clean.length !== 6) return [0, 0, 0];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl([r, g, b]: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return [h * 60, s * 100, l * 100];
}

function hslToRgb([h, s, l]: Hsl): Rgb {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;
  if (sn === 0) {
    const v = ln * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return [
    hue2rgb(p, q, hn + 1 / 3) * 255,
    hue2rgb(p, q, hn) * 255,
    hue2rgb(p, q, hn - 1 / 3) * 255,
  ];
}

/** "#FF5A3C" → "255 90 60" (formato que espera `rgb(var(--x) / <alpha-value>)` de Tailwind). */
export function hexToRgbTriplet(hex: string): string {
  return hexToRgb(hex).join(' ');
}

/**
 * Mismo matiz, ajusta luminosidad (y limita saturación) — para derivar la
 * variante de modo oscuro de un color claro (o viceversa) sin que quede
 * "neón". Devuelve el triplete "R G B" listo para una variable CSS —
 * SOLO sirve dentro de `vars({...})` (NativeWind). Para un color literal
 * (`color={...}` de un ícono, `style={{ backgroundColor: ... }}`) usar
 * `deriveVariantHex`: un triplete desnudo ("18 18 27") NO es un color válido
 * de React Native — ahí se necesita "#121B1B" o "rgb(18,18,27)". Pasar el
 * triplete donde se espera un color de verdad deja el ícono/fondo inválido
 * (se ve negro o directamente no pinta nada — así se rompieron los navbars
 * en modo oscuro, ver NOTAS.md §51).
 */
export function deriveVariant(
  hex: string,
  targetLightness: number,
  maxSaturation = 25,
): string {
  const [h, s] = rgbToHsl(hexToRgb(hex));
  return hslToRgb([h, Math.min(s, maxSaturation), targetLightness])
    .map((v) => Math.round(v))
    .join(' ');
}

/** Igual que `deriveVariant`, pero en "#RRGGBB" — para color literal (ícono, sceneStyle, etc). */
export function deriveVariantHex(
  hex: string,
  targetLightness: number,
  maxSaturation = 25,
): string {
  const [h, s] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([h, Math.min(s, maxSaturation), targetLightness]));
}

/** Aclara un color manteniendo el matiz — para primary-soft/primary-tint a partir de primary. */
export function lightenHex(hex: string, targetLightness: number, minSaturation = 0): string {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  const lightness = Math.max(targetLightness, l);
  const saturation = Math.max(s, minSaturation);
  return rgbToHex(hslToRgb([h, saturation, lightness]));
}
