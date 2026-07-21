import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { settlementPeriodLabel } from '@/lib/settlement-period-label';

type Props = {
  periodType: 'quincena' | 'month' | 'year';
  periodStart: string;
  periodEnd: string;
  ordersCount: number;
  /** Cifra principal ya formateada ("Comisión", "Le corresponde", …). */
  primaryLabel: string;
  primaryValue: string;
  /** Cifra secundaria opcional ("Vendió", "Domicilios cobrados", …). */
  secondaryLabel?: string;
  secondaryValue?: string;
  /** Solo quincena: estado del cobro/pago. */
  isPaid?: boolean;
  paidLabel: string;
  pendingLabel: string;
  /** Solo mes/año: cuántas de sus quincenas/meses ya están al día. */
  paidSubperiods?: number;
  totalSubperiods?: number;
  subperiodsLabel?: string;
  onPress: () => void;
};

/**
 * Tarjeta genérica de un período de liquidación (§42) — la usan las 3
 * pantallas de cobros (negocios, repartidores, "Mis pedidos"). En año/mes
 * navega al siguiente nivel; en quincena abre el diálogo de marcar/deshacer
 * (o solo muestra el detalle, en modo lectura).
 */
export function SettlementPeriodCard({
  periodType,
  periodStart,
  periodEnd,
  ordersCount,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  isPaid,
  paidLabel,
  pendingLabel,
  paidSubperiods,
  totalSubperiods,
  subperiodsLabel,
  onPress,
}: Props) {
  const isQuincena = periodType === 'quincena';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] font-extrabold text-dark">
          {settlementPeriodLabel({ periodType, periodStart, periodEnd })}
        </Text>
        {isQuincena ? (
          <Badge
            label={isPaid ? paidLabel : pendingLabel}
            tone={isPaid ? 'green' : 'amber'}
          />
        ) : (
          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-bold text-muted">
              {paidSubperiods ?? 0}/{totalSubperiods ?? 0} {subperiodsLabel}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#7A7A8A" />
          </View>
        )}
      </View>

      <Text className="mt-1 text-xs text-muted">
        {ordersCount} {ordersCount === 1 ? 'pedido' : 'pedidos'}
      </Text>

      <View className="mt-2.5 flex-row items-end justify-between">
        <View>
          <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
            {primaryLabel}
          </Text>
          <Text className="text-lg font-extrabold text-primary">
            {primaryValue}
          </Text>
        </View>
        {secondaryLabel && secondaryValue ? (
          <View className="items-end">
            <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
              {secondaryLabel}
            </Text>
            <Text className="text-sm font-semibold text-dark">
              {secondaryValue}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
