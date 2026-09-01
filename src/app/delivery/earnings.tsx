import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { SettlementPeriodCard } from '@/components/admin/settlement-period-card';
import { InactiveAccountNotice } from '@/components/delivery/inactive-account-notice';
import { ListEmpty } from '@/components/ui/list-empty';
import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';
import { useSettlementDrillDown } from '@/hooks/use-settlement-drilldown';
import { useSession } from '@/hooks/use-session';
import { formatPrice } from '@/lib/price';
import { getAppColors } from '@/lib/app-colors';
import {
  DeliverySettlementPeriod,
  myDeliverySettlementsService,
} from '@/services/admin-delivery-settlements';

const SUBPERIOD_LABEL = { year: 'meses', month: 'quincenas' } as const;

/**
 * "Mis cobros" del domiciliario (§42): año → mes → quincena, SOLO LECTURA —
 * lo que ya ganó y lo que le falta por cobrar (Mándalo se lo paga cada
 * quincena, acá solo se consulta el estado). Espejo de
 * `admin/delivery-billing.tsx` pero self-scoped y sin botón de marcar.
 */
export default function DeliveryEarningsScreen() {
  const session = useSession();
  // Cuenta en revisión: no puede haber pedidos entregados todavía — ni vale
  // la pena pedirlos (siempre saldría vacío) ni tiene sentido dejar
  // "navegar" la pantalla como si tuviera datos.
  const pending = session?.user.isActive === false;
  const fetcher = useCallback(
    async (periodType: 'quincena' | 'month' | 'year') => {
      if (pending) return [];
      const res = await myDeliverySettlementsService.periods(periodType);
      return res.data.periods;
    },
    [pending],
  );
  const dd = useSettlementDrillDown<DeliverySettlementPeriod>(fetcher);

  if (pending) {
    return <InactiveAccountNotice title="Mis cobros" />;
  }

  return (
    <PanelSafeArea>
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        <PanelHeader
          title="Mis cobros"
          subtitle={
            dd.level === 'year'
              ? 'Total entregado por año'
              : dd.level === 'month'
                ? `${dd.year} · por mes`
                : `${dd.month} · quincenas`
          }
          menu={
            dd.level === 'year' ? undefined : (
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
            <ActivityIndicator size="large" color={getAppColors().primaryColor} />
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
                breakdown={[
                  { label: 'Viaje (base + km)', value: formatPrice(item.tripTotal) },
                  ...(item.nightTotal > 0
                    ? [{ label: 'Recargo nocturno', value: formatPrice(item.nightTotal) }]
                    : []),
                  ...(item.weatherTotal > 0
                    ? [{ label: 'Recargo por clima', value: formatPrice(item.weatherTotal) }]
                    : []),
                  ...(item.demandTotal > 0
                    ? [{ label: 'Recargo por demanda', value: formatPrice(item.demandTotal) }]
                    : []),
                  ...(item.retryTotal > 0
                    ? [{ label: 'Segundo intento', value: formatPrice(item.retryTotal) }]
                    : []),
                ]}
                isPaid={item.settlement?.isPaid}
                paidLabel="Cobrado"
                pendingLabel="Pendiente"
                paidSubperiods={item.paidSubperiods}
                totalSubperiods={item.totalSubperiods}
                subperiodsLabel={dd.level === 'month' ? SUBPERIOD_LABEL.month : SUBPERIOD_LABEL.year}
                onPress={() => item.periodType !== 'quincena' && dd.drillInto(item.periodStart)}
              />
            )}
            // Fijo, sin sumar insets.bottom: esta pantalla vive dentro del
            // menú inferior de Tabs (delivery/_layout.tsx), que ya reserva
            // el inset real por su cuenta.
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            ListEmptyComponent={
              <ListEmpty icon="bicycle-outline" message="Aún no has entregado pedidos." />
            }
          />
        )}
      </View>
    </PanelSafeArea>
  );
}
