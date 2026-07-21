import { http } from '@/lib/http';
import { SettlementPeriodType } from '@/services/admin-settlements';

/** Snapshot guardado al marcar "pagado" (no cambia si entran más entregas). */
export type DeliverySettlementSnapshot = {
  id: number;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
  ordersCount: number;
  deliveryTotal: number;
  riderCut: number;
};

/** Un período entregado por el repartidor tal como lo devuelve `/delivery-settlement/periods`. */
export type DeliverySettlementPeriod = {
  periodType: SettlementPeriodType;
  periodStart: string;
  periodEnd: string;
  ordersCount: number;
  /** Suma de las tarifas de domicilio cobradas al cliente. */
  deliveryTotal: number;
  /** Parte que se queda Mándalo. */
  mandaloCut: number;
  /** Parte que le corresponde al repartidor (lo que se le paga). */
  riderCut: number;
  /** Solo quincena: el pago real (se marca/desmarca). Null en mes/año. */
  settlement: DeliverySettlementSnapshot | null;
  /** Solo mes/año: cuántas de sus quincenas/meses ya están pagados. */
  paidSubperiods?: number;
  totalSubperiods?: number;
};

/**
 * Pagos de la plataforma a los repartidores (solo ADMIN) — espejo de
 * `admin-settlements.ts` pero en la dirección contraria de la plata: acá
 * Mándalo le paga al repartidor lo que ganó en domicilios (§42).
 */
export const adminDeliverySettlementsService = {
  periods: (deliveryUserId: string, periodType: SettlementPeriodType) =>
    http<{ data: { periods: DeliverySettlementPeriod[] } }>(
      `/delivery-settlement/periods?deliveryUserId=${deliveryUserId}&periodType=${periodType}`,
      { auth: true },
    ),

  /** Marca una QUINCENA como pagada (true) o deshace el pago (false). */
  mark: (payload: {
    deliveryUserId: string;
    periodStart: string;
    isPaid: boolean;
    notes?: string;
  }) =>
    http<{ message?: string }>('/delivery-settlement/mark', {
      method: 'PATCH',
      body: { ...payload, periodType: 'quincena' as const },
      auth: true,
      toastSuccess: true,
    }),
};

/** "Mis pedidos" del propio repartidor (self-scoped, solo lectura). */
export const myDeliverySettlementsService = {
  periods: (periodType: SettlementPeriodType) =>
    http<{ data: { periods: DeliverySettlementPeriod[] } }>(
      `/delivery-settlement/mine?periodType=${periodType}`,
      { auth: true },
    ),
};
