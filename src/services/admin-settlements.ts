import { http } from '@/lib/http';

/** Agrupación del cobro: semana ISO (lunes), mes o año (hora Colombia). */
export type SettlementPeriodType = 'week' | 'month' | 'year';

/** Snapshot guardado al marcar "cobrado" (no cambia si entran más entregas). */
export type SettlementSnapshot = {
  id: number;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
  ordersCount: number;
  salesTotal: number;
  deliveryTotal: number;
  commissionTotal: number;
};

/** Un período facturado del negocio tal como lo devuelve `/settlement/periods`. */
export type SettlementPeriod = {
  periodType: SettlementPeriodType;
  /** Inicio y fin del período (YYYY-MM-DD, inclusive). */
  periodStart: string;
  periodEnd: string;
  /** Vigente: pedidos ENTREGADOS del período y sus totales. */
  ordersCount: number;
  salesTotal: number;
  deliveryTotal: number;
  orderCommissionRate: number;
  deliveryCommissionRate: number;
  orderCommission: number;
  deliveryCommission: number;
  commissionTotal: number;
  settlement: SettlementSnapshot | null;
};

export type SettlementPeriodsResponse = {
  orderRate: number;
  deliveryRate: number;
  periods: SettlementPeriod[];
};

/**
 * Cobros de la plataforma a los negocios (solo ADMIN). La comisión es % sobre
 * lo vendido + % sobre los domicilios de los pedidos entregados; los montos
 * los calcula SIEMPRE el backend.
 */
export const adminSettlementsService = {
  periods: (organizationalId: number, periodType: SettlementPeriodType) =>
    http<{ data: SettlementPeriodsResponse }>(
      `/settlement/periods?organizationalId=${organizationalId}&periodType=${periodType}`,
      { auth: true },
    ),

  /** Marca un período como cobrado (true) o deshace el cobro (false). */
  mark: (payload: {
    organizationalId: number;
    periodType: SettlementPeriodType;
    periodStart: string;
    isPaid: boolean;
    notes?: string;
  }) =>
    http<{ message?: string }>('/settlement/mark', {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),
};
