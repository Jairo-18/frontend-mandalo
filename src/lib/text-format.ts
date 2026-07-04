/**
 * Pipeline de formateo de texto para los inputs (ver `TextField.format`).
 *
 * Mientras se escribe (`formatText`): bloquea espacios al inicio, colapsa
 * espacios dobles y aplica la regla del formato (mayúsculas de nombre, solo
 * dígitos, etc.). Se permite UN espacio al final para poder seguir escribiendo
 * la siguiente palabra; ese sobrante se limpia al salir del campo
 * (`finishText`, que dispara el TextField en el blur).
 */
export type TextFormat = 'name' | 'email' | 'digits' | 'username' | 'text';

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
};

/** Aplica la regla del formato en cada pulsación. */
export function formatText(format: TextFormat, value: string): string {
  return FORMATTERS[format](value);
}

/** Limpieza final al salir del campo (o antes de enviar): quita el espacio sobrante. */
export function finishText(value: string): string {
  return value.trim();
}
