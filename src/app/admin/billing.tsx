import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettlementPeriodCard } from '@/components/admin/settlement-period-card';
import { OrderCard } from '@/components/orders/order-card';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { ListEmpty } from '@/components/ui/list-empty';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useSettlementDrillDown } from '@/hooks/use-settlement-drilldown';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { formatPrice } from '@/lib/price';
import { settlementPeriodLabel } from '@/lib/settlement-period-label';
import { adminSettlementsService, SettlementPeriod } from '@/services/admin-settlements';
import { Order, ordersService } from '@/services/orders';

const SUBPERIOD_LABEL = { year: 'meses', month: 'quincenas' } as const;

/**
 * Cobros de UN negocio (rol ADMIN, §42): año → mes → quincena. Solo la
 * quincena se marca "cobrado" — mes y año son resúmenes. Se llega desde el
 * botón de facturación de la tarjeta en Negocios.
 */
export default function AdminBillingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orgId?: string; name?: string }>();
  const organizationalId = Number(params.orgId) || 0;

  const fetcher = useCallback(
    async (periodType: 'quincena' | 'month' | 'year') => {
      const res = await adminSettlementsService.periods(organizationalId, periodType);
      return res.data.periods;
    },
    [organizationalId],
  );
  const dd = useSettlementDrillDown<SettlementPeriod>(fetcher);

  const [toMark, setToMark] = useState<SettlementPeriod | null>(null);
  const [ordersOf, setOrdersOf] = useState<SettlementPeriod | null>(null);

  async function handleMark() {
    if (!toMark) return;
    await adminSettlementsService.mark({
      organizationalId,
      periodStart: toMark.periodStart,
      isPaid: !toMark.settlement?.isPaid,
    });
    setToMark(null);
    dd.refresh();
  }

  if (!organizationalId) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Ionicons name="cash-outline" size={40} color="#7A7A8A" />
        <Text className="mt-3 text-center text-sm text-muted">
          Entra desde la sección Negocios: toca el botón de facturación de un
          negocio para ver sus cobros.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center gap-3 bg-white px-5 pb-3 pt-2">
        <Pressable
          onPress={() =>
            // Es un Drawer.Screen hermano de "businesses" (no está en el
            // sidebar): router.back() no es confiable entre pantallas del
            // drawer (puede caer al Inicio) — se navega directo a la lista.
            dd.level === 'year' ? router.navigate('/admin/businesses') : dd.goBack()
          }
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#1E1E2D" />
        </Pressable>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-base font-extrabold text-dark">
            {params.name || 'Cobros del negocio'}
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
              primaryLabel="Comisión"
              primaryValue={formatPrice(item.commissionTotal)}
              secondaryLabel="Vendió"
              secondaryValue={formatPrice(item.salesTotal)}
              isPaid={item.settlement?.isPaid}
              paidLabel="Cobrado"
              pendingLabel="Pendiente"
              paidSubperiods={item.paidSubperiods}
              totalSubperiods={item.totalSubperiods}
              subperiodsLabel={dd.level === 'month' ? SUBPERIOD_LABEL.month : SUBPERIOD_LABEL.year}
              onPress={() =>
                item.periodType === 'quincena' ? setOrdersOf(item) : dd.drillInto(item.periodStart)
              }
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <ListEmpty icon="cash-outline" message="Este negocio aún no tiene pedidos entregados." />
          }
        />
      )}

      {/* Solo en quincena: botón directo de marcar (además de tocar la tarjeta → ver pedidos). */}
      {dd.level === 'quincena' && dd.items.length > 0 && (
        <View
          className="border-t border-gray-100 bg-white px-4 pb-2 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {dd.items.map((item) => (
            <Pressable
              key={item.periodStart}
              onPress={() => setToMark(item)}
              className={`mb-2 flex-row items-center justify-center gap-2 rounded-xl py-2.5 active:opacity-80 ${
                item.settlement?.isPaid ? 'bg-surface' : 'bg-primary'
              }`}
            >
              <Ionicons
                name={item.settlement?.isPaid ? 'checkbox' : 'square-outline'}
                size={17}
                color={item.settlement?.isPaid ? '#059669' : '#FFFFFF'}
              />
              <Text
                className={`text-sm font-bold ${item.settlement?.isPaid ? 'text-dark' : 'text-white'}`}
              >
                {settlementPeriodLabel(item)} —{' '}
                {item.settlement?.isPaid ? 'cobrado, tocar para deshacer' : 'marcar como cobrado'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <YesNoDialog
        visible={!!toMark}
        destructive={toMark?.settlement?.isPaid ?? false}
        icon={toMark?.settlement?.isPaid ? 'close-circle-outline' : 'cash-outline'}
        title={toMark?.settlement?.isPaid ? '¿Deshacer el cobro?' : '¿Marcar como cobrado?'}
        message={
          toMark
            ? toMark.settlement?.isPaid
              ? `La quincena ${settlementPeriodLabel(toMark)} volverá a "Pendiente".`
              : `Confirmas que el negocio ya te pagó ${formatPrice(
                  toMark.commissionTotal,
                )} de la quincena ${settlementPeriodLabel(toMark)}.`
            : ''
        }
        confirmLabel={toMark?.settlement?.isPaid ? 'Deshacer' : 'Sí, cobrado'}
        onConfirm={handleMark}
        onCancel={() => setToMark(null)}
      />

      <PeriodOrdersModal
        organizationalId={organizationalId}
        period={ordersOf}
        onClose={() => setOrdersOf(null)}
      />
    </View>
  );
}

/** Pedidos ENTREGADOS de una quincena (evidencia de lo que se está cobrando). */
function PeriodOrdersModal({
  organizationalId,
  period,
  onClose,
}: {
  organizationalId: number;
  period: SettlementPeriod | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const list = usePaginatedList<Order>(
    useCallback(
      (listParams) =>
        period
          ? ordersService.paginated({
              ...listParams,
              stateCodes: ['ENTR'],
              organizationalId,
              deliveredFrom: period.periodStart,
              deliveredTo: period.periodEnd,
            })
          : Promise.resolve({
              data: [],
              pagination: {
                page: 1,
                perPage: 20,
                total: 0,
                pageCount: 0,
                hasPreviousPage: false,
                hasNextPage: false,
              },
            }),
      [organizationalId, period],
    ),
  );

  return (
    <Modal visible={period != null} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color="#1E1E2D" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-dark">Pedidos entregados</Text>
            {period && <Text className="text-xs text-muted">{settlementPeriodLabel(period)}</Text>}
          </View>
        </View>

        <FlatList
          data={list.items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              title={item.user?.fullName ?? 'Cliente'}
              titleIcon="person-outline"
              perspective="business"
              onPress={() => setSelectedId(item.id)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshing={list.refreshing}
          onRefresh={() => list.fetchPage(1, 'refresh')}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            list.loadingMore ? (
              <ActivityIndicator size="small" color="#FF5A3C" style={{ paddingVertical: 12 }} />
            ) : null
          }
          ListEmptyComponent={
            list.loading ? (
              <ActivityIndicator size="large" color="#FF5A3C" style={{ paddingTop: 48 }} />
            ) : (
              <ListEmpty icon="receipt-outline" message="No hay pedidos entregados en esta quincena." />
            )
          }
        />

        <OrderDetailModal orderId={selectedId} perspective="business" onClose={() => setSelectedId(null)} />
      </View>
    </Modal>
  );
}
