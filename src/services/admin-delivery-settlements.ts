import { http } from '@/lib/http';
import { formatPrice } from '@/lib/price';
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
  /** Desglose de `riderCut` (reunión con el cliente 2026-08-04, "control estricto"). */
  tripTotal: number;
  nightTotal: number;
  weatherTotal: number;
  demandTotal: number;
  retryTotal: number;
  /**
   * Mandados: el cliente le paga directo al repartidor. `collectedTotal` es
   * lo que ya cobró así y se descuenta: `netPayable` = riderCut −
   * collectedTotal (negativo = el repartidor le debe a Mándalo la comisión).
   * Opcionales por compatibilidad con un backend viejo.
   */
  collectedTotal?: number;
  errandsCount?: number;
  netPayable?: number;
  /** Solo quincena: el pago real (se marca/desmarca). Null en mes/año. */
  settlement: DeliverySettlementSnapshot | null;
  /** Solo mes/año: cuántas de sus quincenas/meses ya están pagados. */
  paidSubperiods?: number;
  totalSubperiods?: number;
};

/** Lo que de verdad se le paga al repartidor (o él debe, si es negativo). */
export function riderNet(period: DeliverySettlementPeriod): number {
  return period.netPayable ?? period.riderCut;
}

/** Fila del desglose para lo ya cobrado en mandados (si hubo). */
export function collectedRow(period: DeliverySettlementPeriod) {
  const collected = period.collectedTotal ?? 0;
  if (!(collected > 0)) return [];
  const n = period.errandsCount ?? 0;
  return [
    {
      label: `Ya cobrado en mandados${n ? ` (${n})` : ''}`,
      value: `−${formatPrice(collected)}`,
    },
  ];
}

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
