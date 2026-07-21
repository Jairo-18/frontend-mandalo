import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuButton } from '@/components/client/menu-button';
import { SettlementPeriodCard } from '@/components/admin/settlement-period-card';
import { ListEmpty } from '@/components/ui/list-empty';
import { PanelHeader } from '@/components/ui/panel-header';
import { useSettlementDrillDown } from '@/hooks/use-settlement-drilldown';
import { formatPrice } from '@/lib/price';
import {
  DeliverySettlementPeriod,
  myDeliverySettlementsService,
} from '@/services/admin-delivery-settlements';

const SUBPERIOD_LABEL = { year: 'meses', month: 'quincenas' } as const;

/**
 * "Mis pagos" del domiciliario (§42): año → mes → quincena, SOLO LECTURA —
 * lo que ya ganó y lo que le falta por cobrar (Mándalo se lo paga aparte,
 * acá solo se consulta el estado). Espejo de `admin/delivery-billing.tsx`
 * pero self-scoped y sin botón de marcar.
 */
export default function DeliveryEarningsScreen() {
  const fetcher = useCallback(async (periodType: 'quincena' | 'month' | 'year') => {
    const res = await myDeliverySettlementsService.periods(periodType);
    return res.data.periods;
  }, []);
  const dd = useSettlementDrillDown<DeliverySettlementPeriod>(fetcher);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        <PanelHeader
          title="Mis pagos"
          subtitle={
            dd.level === 'year'
              ? 'Total entregado por año'
              : dd.level === 'month'
                ? `${dd.year} · por mes`
                : `${dd.month} · quincenas`
          }
          menu={
            dd.level === 'year' ? (
              <MenuButton parent="/delivery" />
            ) : (
              <Pressable
                onPress={dd.goBack}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
            )
          }
        />

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
                primaryLabel="Ganaste"
                primaryValue={formatPrice(item.riderCut)}
                secondaryLabel="Domicilios"
                secondaryValue={formatPrice(item.deliveryTotal)}
                isPaid={item.settlement?.isPaid}
                paidLabel="Pagado"
                pendingLabel="Pendiente"
                paidSubperiods={item.paidSubperiods}
                totalSubperiods={item.totalSubperiods}
                subperiodsLabel={dd.level === 'month' ? SUBPERIOD_LABEL.month : SUBPERIOD_LABEL.year}
                onPress={() => item.periodType !== 'quincena' && dd.drillInto(item.periodStart)}
              />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            ListEmptyComponent={
              <ListEmpty icon="bicycle-outline" message="Aún no has entregado pedidos." />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
