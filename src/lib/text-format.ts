/**
 * Pipeline de formateo de texto para los inputs (ver `TextField.format`).
 *
 * Mientras se escribe (`formatText`): bloquea espacios al inicio, colapsa
 * espacios dobles y aplica la regla del formato (mayúsculas de nombre, solo
 * dígitos, etc.). Se permite UN espacio al final para poder seguir escribiendo
 * la siguiente palabra; ese sobrante se limpia al salir del campo
 * (`finishText`, que dispara el TextField en el blur).
 */
export type TextFormat =
  | 'name'
  | 'email'
  | 'digits'
  | 'username'
  | 'text'
  | 'sentence'
  | 'phone'
  | 'identification'
  | 'upper'
  | 'nit'
  | 'cop';

/** Validación de formato de correo (compartida por login y registro). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sin espacios al inicio ni dobles en la mitad (deja el del final mientras se escribe). */
function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trimStart();
}

/** Primera letra de cada palabra en mayúscula, el resto en minúscula. */
function titleCase(value: string): string {
  return collapseSpaces(value)
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase());
}

/** Agrupa dígitos de a 3 para lectura: "3102103660" → "310 210 366 0". */
function groupDigits(digits: string): string {
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

/**
 * Prefijo internacional que se prellena en los campos de celular (el usuario
 * puede borrarlo o cambiarlo — p. ej. un extranjero).
 */
export const PHONE_PREFIX = '+57 - ';

/**
 * Teléfono legible: "+CC - GGG GGG …". El indicativo son los dígitos antes
 * del guion (el prellenado "+57 - " ya lo trae); sin guion solo agrupa. La
 * versión para el backend la da `normalizePhone`.
 */
function formatPhone(value: string): string {
  const cleaned = value.replace(/[^\d+\-]/g, '');
  if (!cleaned) return '';

  const hasPlus = cleaned.startsWith('+');
  const dashIndex = cleaned.indexOf('-');

  if (hasPlus && dashIndex > 0) {
    const prefixDigits = cleaned.slice(0, dashIndex).replace(/\D/g, '').slice(0, 3);
    const rest = cleaned.slice(dashIndex + 1).replace(/\D/g, '');
    return `+${prefixDigits} - ${groupDigits(rest)}`.trimEnd();
  }

  const digits = cleaned.replace(/\D/g, '');

  // Guardado del backend ("+573102103660", sin guion): el celular son los
  // últimos 10 dígitos y lo que sobra adelante es el indicativo. Sin esto se
  // agrupaba todo corrido ("+573 102 103 660") al prellenar los formularios.
  if (hasPlus && digits.length > 10) {
    const prefix = digits.slice(0, digits.length - 10);
    return `+${prefix} - ${groupDigits(digits.slice(-10))}`;
  }

  return (hasPlus ? '+' : '') + groupDigits(digits);
}

/** Deja el teléfono listo para el backend: '+' inicial (si hay) + dígitos. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return value.trim().startsWith('+') ? `+${digits}` : digits;
}

const FORMATTERS: Record<TextFormat, (value: string) => string> = {
  /** Nombres propios: "  juAN   péREZ " → "Juan Pérez". */
  name: titleCase,
  /** Correos: minúsculas, sin espacios y solo caracteres válidos de email. */
  email: (v) => v.toLowerCase().replace(/[^a-z0-9@._+-]/g, ''),
  /** Solo dígitos (teléfono, número de identificación). */
  digits: (v) => v.replace(/\D/g, ''),
  /** Usuarios: minúsculas, sin espacios, solo letras/números/._- */
  username: (v) => v.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
  /** Texto libre (dirección, etc.): solo la limpieza de espacios. */
  text: collapseSpaces,
  /** Descripciones: limpieza de espacios + primera letra en mayúscula. */
  sentence: (v) => {
    const s = collapseSpaces(v);
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  /** Celular legible: "+57 - 310 210 366 0" (enviar con normalizePhone). */
  phone: formatPhone,
  /** Identificación: números y letras MAYÚSCULAS (cédulas y pasaportes). */
  identification: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
  /** MAYÚSCULAS sostenidas (razón social). */
  upper: (v) => collapseSpaces(v).toUpperCase(),
  /** NIT: dígitos y guion de verificación ("901234567-8"). */
  nit: (v) => v.replace(/[^0-9-]/g, ''),
  /** Pesos colombianos legibles: "20000" → "20.000" (enviar con copToNumber). */
  cop: (v) => {
    const digits = v.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },
};

/** Deja un precio con formato `cop` listo para el backend: "20.000" → 20000. */
export function copToNumber(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : NaN;
}

/**
 * Teléfono para el payload: normalizado si trae un número real (≥10 dígitos,
 * mismo umbral del registro), null si quedó vacío o solo el prefijo "+57 - "
 * prellenado. Evita guardar "+57" como teléfono.
 */
export function phoneOrNull(value: string): string | null {
  const normalized = normalizePhone(value);
  return normalized.replace(/\D/g, '').length >= 10 ? normalized : null;
}

/**
 * "HH:MM" (24 h, como se guarda en la DB) → "h:MM a. m./p. m." para mostrar.
 * "00:00" → "12:00 a. m." · "13:30" → "1:30 p. m.". Si no parsea, devuelve
 * el valor tal cual (no revienta con datos raros).
 */
export function formatHour12(time: string): string {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return time;
  const hour = Number(match[1]);
  const suffix = hour < 12 ? 'a. m.' : 'p. m.';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

/** Aplica la regla del formato en cada pulsación. */
export function formatText(format: TextFormat, value: string): string {
  return FORMATTERS[format](value);
}

/** Limpieza final al salir del campo (o antes de enviar): quita el espacio sobrante. */
export function finishText(value: string): string {
  return value.trim();
}
