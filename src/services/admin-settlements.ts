import { http } from '@/lib/http';

/**
 * Agrupación del cobro: la quincena es la única unidad cobrable; mes y año
 * son resúmenes armados sumando quincenas (§42) — no se marcan por sí solos.
 */
export type SettlementPeriodType = 'quincena' | 'month' | 'year';

/** Snapshot guardado al marcar "cobrado" (no cambia si entran más entregas). */
export type SettlementSnapshot = {
  id: number;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
  ordersCount: number;
  salesTotal: number;
  commissionTotal: number;
};

/** Un período facturado del negocio tal como lo devuelve `/settlement/periods`. */
export type SettlementPeriod = {
  periodType: SettlementPeriodType;
  /** Inicio y fin del período (YYYY-MM-DD, inclusive). */
  periodStart: string;
  periodEnd: string;
  ordersCount: number;
  salesTotal: number;
  commissionRate: number;
  commissionTotal: number;
  /** Solo quincena: el cobro real (se marca/desmarca). Null en mes/año. */
  settlement: SettlementSnapshot | null;
  /** Solo mes/año: cuántas de sus quincenas/meses ya están cobrados. */
  paidSubperiods?: number;
  totalSubperiods?: number;
};

export type SettlementPeriodsResponse = {
  commissionRate: number;
  periods: SettlementPeriod[];
};

/**
 * Cobros de la plataforma a los negocios (solo ADMIN). La comisión es % sobre
 * lo vendido (subtotal), la tasa propia de CADA negocio; los montos los
 * calcula SIEMPRE el backend. El domicilio no se cobra al negocio (§42).
 */
export const adminSettlementsService = {
  periods: (organizationalId: number, periodType: SettlementPeriodType) =>
    http<{ data: SettlementPeriodsResponse }>(
      `/settlement/periods?organizationalId=${organizationalId}&periodType=${periodType}`,
      { auth: true },
    ),

  /** Marca una QUINCENA como cobrada (true) o deshace el cobro (false). */
  mark: (payload: {
    organizationalId: number;
    periodStart: string;
    isPaid: boolean;
    notes?: string;
  }) =>
    http<{ message?: string }>('/settlement/mark', {
      method: 'PATCH',
      body: { ...payload, periodType: 'quincena' as const },
      auth: true,
      toastSuccess: true,
    }),
};

/** "Mis pedidos" del propio negocio (self-scoped, rol NEGO, solo lectura). */
export const myBusinessSettlementsService = {
  periods: (periodType: SettlementPeriodType) =>
    http<{ data: SettlementPeriodsResponse }>(
      `/settlement/mine?periodType=${periodType}`,
      { auth: true },
    ),
};
