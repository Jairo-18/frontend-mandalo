const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];
const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** "2026-07-16" → { y, m (1–12), d }. Sin `new Date(str)`: evita líos de TZ. */
function dateParts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Etiqueta humana del período: "1 – 15 jul 2026", "Julio 2026" o "2026". */
export function settlementPeriodLabel(period: {
  periodType: 'quincena' | 'month' | 'year';
  periodStart: string;
  periodEnd: string;
}): string {
  const start = dateParts(period.periodStart);
  const end = dateParts(period.periodEnd);
  switch (period.periodType) {
    case 'quincena':
      return `${start.d} – ${end.d} ${MONTHS_SHORT[end.m - 1]} ${end.y}`;
    case 'month':
      return `${MONTHS_FULL[start.m - 1]} ${start.y}`;
    case 'year':
      return `${start.y}`;
  }
}
