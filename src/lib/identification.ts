import type { IdentificationType } from '@/services/catalog';

/**
 * Números de identificación colombianos por tipo — mismas reglas que
 * `backend-mandalo/src/shared/utils/identification.util.ts`:
 * - CC: solo dígitos, 3 a 10.
 * - TI: solo dígitos, 10 u 11.
 * - NIT (DIAN): número base de 5 a 10 dígitos y, opcional, el dígito de
 *   verificación con guion (`900123456-7`), que se comprueba con el
 *   algoritmo de la DIAN. El guion solo se permite en NIT.
 */

/** Pesos de la DIAN, aplicados de derecha a izquierda sobre el NIT base. */
const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Dígito de verificación (DV) de un NIT base (solo dígitos). */
export function nitCheckDigit(base: string): number {
  const sum = base
    .split('')
    .reverse()
    .reduce((acc, digit, i) => acc + Number(digit) * NIT_WEIGHTS[i], 0);
  const remainder = sum % 11;
  return remainder > 1 ? 11 - remainder : remainder;
}

/** Mensaje de error del número según el código del tipo, o null si es válido. */
export function identificationError(
  typeCode: string | null | undefined,
  value: string,
): string | null {
  const number = value.trim();
  if (typeCode === 'NIT') {
    const match = /^(\d{5,10})(?:-(\d))?$/.exec(number);
    if (!match) {
      return 'El NIT lleva solo números y, si quieres, el dígito de verificación con guion (ej: 900123456-7).';
    }
    if (match[2] !== undefined) {
      const expected = nitCheckDigit(match[1]);
      if (Number(match[2]) !== expected) {
        return `El dígito de verificación no corresponde a este NIT (debería ser ${expected}).`;
      }
    }
    return null;
  }
  if (!/^\d+$/.test(number)) {
    return 'Solo números: sin letras, puntos, espacios ni guiones.';
  }
  if (typeCode === 'TI' && (number.length < 10 || number.length > 11)) {
    return 'La tarjeta de identidad tiene 10 u 11 dígitos.';
  }
  if (typeCode === 'CC' && (number.length < 3 || number.length > 10)) {
    return 'La cédula tiene entre 3 y 10 dígitos.';
  }
  return null;
}

/**
 * Para el `validate()` de los formularios: error del número según el tipo
 * elegido en el Select (por id). Vacío o sin tipo → sin error acá (el
 * "obligatorio" / "selecciona el tipo" lo decide cada formulario).
 */
export function identificationErrorFor(
  types: IdentificationType[],
  typeId: number | null | undefined,
  value: string,
): string | undefined {
  if (!value.trim() || !typeId) return undefined;
  const code = types.find((t) => t.id === typeId)?.code;
  return identificationError(code, value) ?? undefined;
}
