import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettlementPeriodCard } from '@/components/admin/settlement-period-card';
import { ListEmpty } from '@/components/ui/list-empty';
import { useSettlementDrillDown } from '@/hooks/use-settlement-drilldown';
import { formatPrice } from '@/lib/price';
import { myBusinessSettlementsService, SettlementPeriod } from '@/services/admin-settlements';

const SUBPERIOD_LABEL = { year: 'meses', month: 'quincenas' } as const;

/**
 * "Mis cobros" del negocio (§42): año → mes → quincena, SOLO LECTURA — lo
 * que ya vendió y cuánto de eso ya le cobró Mándalo. Espejo de
 * `admin/billing.tsx` pero self-scoped y sin botón de marcar (el admin es
 * quien marca el cobro, acá el negocio solo consulta el estado).
 */
export default function BusinessEarningsScreen() {
  const insets = useSafeAreaInsets();

  const fetcher = useCallback(async (periodType: 'quincena' | 'month' | 'year') => {
    const res = await myBusinessSettlementsService.periods(periodType);
    return res.data.periods;
  }, []);
  const dd = useSettlementDrillDown<SettlementPeriod>(fetcher);

  return (
    <View className="flex-1 bg-surface">
      {/* Continúa el header oscuro del drawer (mismo patrón que dashboard/products). */}
      <View className="flex-row items-center gap-3 rounded-b-[28px] bg-dark px-5 pb-5 pt-1">
        {dd.level !== 'year' && (
          <Pressable
            onPress={dd.goBack}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-white">Mis cobros</Text>
          <Text className="text-xs text-white/70">
            {dd.level === 'year'
              ? 'Lo que vendiste y lo que ya te cobró Mándalo, por año'
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
              primaryLabel="Vendiste"
              primaryValue={formatPrice(item.salesTotal)}
              secondaryLabel={`Comisión (${item.commissionRate}%)`}
              secondaryValue={formatPrice(item.commissionTotal)}
              isPaid={item.settlement?.isPaid}
              paidLabel="Cobrado"
              pendingLabel="Pendiente"
              paidSubperiods={item.paidSubperiods}
              totalSubperiods={item.totalSubperiods}
              subperiodsLabel={dd.level === 'month' ? SUBPERIOD_LABEL.month : SUBPERIOD_LABEL.year}
              onPress={() => item.periodType !== 'quincena' && dd.drillInto(item.periodStart)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <ListEmpty icon="cash-outline" message="Aún no tienes pedidos entregados." />
          }
        />
      )}
    </View>
  );
}
