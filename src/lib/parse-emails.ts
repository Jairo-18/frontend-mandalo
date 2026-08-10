const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedEmails = {
  valid: string[];
  invalid: string[];
};

/**
 * Parte un texto libre (CSV de una sola columna o correos pegados/escritos a
 * mano) en una lista de correos: separa por coma, punto y coma o salto de
 * línea, recorta espacios, pasa a minúsculas y descarta duplicados.
 */
export function parseEmailsText(text: string): ParsedEmails {
  const tokens = text
    .split(/[,;\n\r]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    if (!EMAIL_REGEX.test(token)) {
      invalid.push(token);
      continue;
    }
    if (seen.has(token)) continue;
    seen.add(token);
    valid.push(token);
  }
  return { valid, invalid };
}
