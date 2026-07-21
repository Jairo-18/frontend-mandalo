import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettlementPeriodCard } from '@/components/admin/settlement-period-card';
import { ListEmpty } from '@/components/ui/list-empty';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useSettlementDrillDown } from '@/hooks/use-settlement-drilldown';
import { formatPrice } from '@/lib/price';
import { settlementPeriodLabel } from '@/lib/settlement-period-label';
import {
  adminDeliverySettlementsService,
  DeliverySettlementPeriod,
} from '@/services/admin-delivery-settlements';

const SUBPERIOD_LABEL = { year: 'meses', month: 'quincenas' } as const;

/**
 * Pagos a UN repartidor (rol ADMIN, §42) — espejo de `admin/billing.tsx` pero
 * en la dirección contraria de la plata: acá Mándalo LE PAGA al repartidor lo
 * que ganó en domicilios. Año → mes → quincena; solo la quincena se marca
 * "pagado". Se llega desde el botón de pagos de la tarjeta en Repartidores.
 */
export default function AdminDeliveryBillingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string; name?: string }>();
  const deliveryUserId = params.userId ?? '';

  const fetcher = useCallback(
    async (periodType: 'quincena' | 'month' | 'year') => {
      const res = await adminDeliverySettlementsService.periods(deliveryUserId, periodType);
      return res.data.periods;
    },
    [deliveryUserId],
  );
  const dd = useSettlementDrillDown<DeliverySettlementPeriod>(fetcher);

  const [toMark, setToMark] = useState<DeliverySettlementPeriod | null>(null);

  async function handleMark() {
    if (!toMark) return;
    await adminDeliverySettlementsService.mark({
      deliveryUserId,
      periodStart: toMark.periodStart,
      isPaid: !toMark.settlement?.isPaid,
    });
    setToMark(null);
    dd.refresh();
  }

  if (!deliveryUserId) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Ionicons name="cash-outline" size={40} color="#7A7A8A" />
        <Text className="mt-3 text-center text-sm text-muted">
          Entra desde la sección Domiciliarios: toca el botón de pagos de un
          domiciliario para ver sus liquidaciones.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center gap-3 bg-white px-5 pb-3 pt-2">
        <Pressable
          onPress={() =>
            // Es un Drawer.Screen hermano de "deliveries" (no está en el
            // sidebar): router.back() no es confiable entre pantallas del
            // drawer (puede caer al Inicio) — se navega directo a la lista.
            dd.level === 'year' ? router.navigate('/admin/deliveries') : dd.goBack()
          }
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#1E1E2D" />
        </Pressable>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-base font-extrabold text-dark">
            {params.name || 'Pagos del domiciliario'}
          </Text>
          <Text className="text-xs text-muted">
            {dd.level === 'year'
              ? 'Por año'
              : dd.level === 'month'
                ? `${dd.year} · por mes`
                : `${dd.month} · quincenas`}
          </Text>
        </View>
      </View>

      {dd.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF5A3C" />
        </View>
      ) : (
        <FlatList
          data={dd.items}
          keyExtractor={(item) => item.periodStart}
          renderItem={({ item }) => (
            <SettlementPeriodCard
              periodType={item.periodType}
              periodStart={item.periodStart}
              periodEnd={item.periodEnd}
              ordersCount={item.ordersCount}
              primaryLabel="Le corresponde"
              primaryValue={formatPrice(item.riderCut)}
              secondaryLabel="Domicilios"
              secondaryValue={formatPrice(item.deliveryTotal)}
              isPaid={item.settlement?.isPaid}
              paidLabel="Pagado"
              pendingLabel="Pendiente"
              paidSubperiods={item.paidSubperiods}
              totalSubperiods={item.totalSubperiods}
              subperiodsLabel={dd.level === 'month' ? SUBPERIOD_LABEL.month : SUBPERIOD_LABEL.year}
              onPress={() =>
                item.periodType === 'quincena' ? setToMark(item) : dd.drillInto(item.periodStart)
              }
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <ListEmpty icon="cash-outline" message="Este domiciliario aún no tiene entregas." />
          }
        />
      )}

      <YesNoDialog
        visible={!!toMark}
        destructive={toMark?.settlement?.isPaid ?? false}
        icon={toMark?.settlement?.isPaid ? 'close-circle-outline' : 'cash-outline'}
        title={toMark?.settlement?.isPaid ? '¿Deshacer el pago?' : '¿Marcar como pagado?'}
        message={
          toMark
            ? toMark.settlement?.isPaid
              ? `La quincena ${settlementPeriodLabel(toMark)} volverá a "Pendiente".`
              : `Confirmas que ya le pagaste ${formatPrice(
                  toMark.riderCut,
                )} al domiciliario por la quincena ${settlementPeriodLabel(toMark)}.`
            : ''
        }
        confirmLabel={toMark?.settlement?.isPaid ? 'Deshacer' : 'Sí, pagado'}
        onConfirm={handleMark}
        onCancel={() => setToMark(null)}
      />
    </View>
  );
}
