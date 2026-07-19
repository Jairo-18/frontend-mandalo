import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderCard } from '@/components/orders/order-card';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { Badge } from '@/components/ui/badge';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListEmpty } from '@/components/ui/list-empty';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { formatPrice } from '@/lib/price';
import {
  adminSettlementsService,
  SettlementPeriod,
  SettlementPeriodsResponse,
  SettlementPeriodType,
} from '@/services/admin-settlements';
import { Order, ordersService } from '@/services/orders';

const PERIOD_OPTIONS: { value: SettlementPeriodType; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];
const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** "2026-07-13" → { y, m (1–12), d }. Sin new Date(str): evita líos de TZ. */
function dateParts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Etiqueta humana del período: "7 – 13 jul 2026", "Julio 2026" o "2026". */
function periodLabel(period: SettlementPeriod): string {
  const start = dateParts(period.periodStart);
  const end = dateParts(period.periodEnd);
  switch (period.periodType) {
    case 'week':
      return start.m === end.m
        ? `${start.d} – ${end.d} ${MONTHS_SHORT[end.m - 1]} ${end.y}`
        : `${start.d} ${MONTHS_SHORT[start.m - 1]} – ${end.d} ${MONTHS_SHORT[end.m - 1]} ${end.y}`;
    case 'month':
      return `${MONTHS_FULL[start.m - 1]} ${start.y}`;
    case 'year':
      return String(start.y);
  }
}

/** "13 jul 2026, 3:45 p. m." para la fecha en que se marcó el cobro. */
function paidAtLabel(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  const h12 = hours % 12 || 12;
  const min = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}, ${h12}:${min} ${ampm}`;
}

/**
 * Facturación de UN negocio (rol ADMIN): cuánto vendió por semana/mes/año en
 * pedidos ENTREGADOS, cuánto le debe a la plataforma (% de ventas + % de
 * domicilios — toda la plata se trata con el negocio) y el check "Cobrado"
 * por período. Se llega desde el botón de la tarjeta en Negocios.
 */
export default function AdminBillingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orgId?: string; name?: string }>();
  const organizationalId = Number(params.orgId) || 0;

  const [periodType, setPeriodType] = useState<SettlementPeriodType>('week');
  const [data, setData] = useState<SettlementPeriodsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Período cuyo check se está confirmando / cuyos pedidos se están viendo.
  const [toMark, setToMark] = useState<SettlementPeriod | null>(null);
  const [ordersOf, setOrdersOf] = useState<SettlementPeriod | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!organizationalId) return;
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      try {
        const res = await adminSettlementsService.periods(
          organizationalId,
          periodType,
        );
        setData(res.data);
      } catch {
        // El interceptor HTTP ya mostró el error.
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [organizationalId, periodType],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleMark() {
    if (!toMark) return;
    try {
      await adminSettlementsService.mark({
        organizationalId,
        periodType,
        periodStart: toMark.periodStart,
        isPaid: !toMark.settlement?.isPaid,
      });
      load();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setToMark(null);
    }
  }

  function renderPeriod({ item }: { item: SettlementPeriod }) {
    const paid = item.settlement?.isPaid ?? false;
    // Entraron entregas DESPUÉS de cobrar: lo vigente ya no es lo cobrado.
    const outdated =
      paid &&
      item.settlement != null &&
      item.commissionTotal !== item.settlement.commissionTotal;

    return (
      <Pressable
        onPress={() => setOrdersOf(item)}
        className="mb-3 rounded-2xl bg-white p-4 active:opacity-80"
      >
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-[15px] font-bold text-dark">
            {periodLabel(item)}
          </Text>
          <Badge
            label={paid ? 'Cobrado' : 'Por cobrar'}
            tone={paid ? 'green' : 'amber'}
          />
        </View>

        <Text className="mt-0.5 text-xs text-muted">
          {item.ordersCount}{' '}
          {item.ordersCount === 1 ? 'pedido entregado' : 'pedidos entregados'} ·
          toca para verlos
        </Text>

        <View className="mt-3 gap-1">
          <Row label="Ventas del negocio" value={formatPrice(item.salesTotal)} />
          <Row label="Domicilios" value={formatPrice(item.deliveryTotal)} />
          <Row
            label={`Comisión ventas (${item.orderCommissionRate}%)`}
            value={formatPrice(item.orderCommission)}
          />
          <Row
            label={`Comisión domicilios (${item.deliveryCommissionRate}%)`}
            value={formatPrice(item.deliveryCommission)}
          />
        </View>

        <View className="mt-2 flex-row items-center justify-between border-t border-gray-100 pt-2">
          <Text className="text-sm font-extrabold text-dark">Te debe</Text>
          <Text className="text-base font-extrabold text-primary">
            {formatPrice(item.commissionTotal)}
          </Text>
        </View>

        {paid && item.settlement?.paidAt && (
          <Text className="mt-1 text-xs text-muted">
            Cobrado el {paidAtLabel(item.settlement.paidAt)}
            {item.settlement.commissionTotal !== item.commissionTotal
              ? ` (${formatPrice(item.settlement.commissionTotal)})`
              : ''}
          </Text>
        )}
        {outdated && (
          <View className="mt-2 rounded-xl bg-amber-50 px-3 py-2">
            <Text className="text-xs font-medium text-amber-600">
              Entraron entregas después del cobro: lo vigente (
              {formatPrice(item.commissionTotal)}) ya no coincide con lo
              cobrado ({formatPrice(item.settlement!.commissionTotal)}).
            </Text>
          </View>
        )}

        {/* Check de control: ¿ya le cobraste este período al negocio? */}
        <Pressable
          onPress={() => setToMark(item)}
          className={`mt-3 flex-row items-center justify-center gap-2 rounded-xl py-2.5 active:opacity-80 ${
            paid ? 'bg-surface' : 'bg-primary'
          }`}
        >
          <Ionicons
            name={paid ? 'checkbox' : 'square-outline'}
            size={18}
            color={paid ? '#059669' : '#FFFFFF'}
          />
          <Text
            className={`text-sm font-bold ${paid ? 'text-dark' : 'text-white'}`}
          >
            {paid ? 'Cobrado — tocar para deshacer' : 'Marcar como cobrado'}
          </Text>
        </Pressable>
      </Pressable>
    );
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
      <View className="px-4 pb-1 pt-3">
        {!!params.name && (
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="storefront-outline" size={16} color="#7A7A8A" />
            <Text numberOfLines={1} className="flex-1 text-sm font-bold text-dark">
              {params.name}
            </Text>
          </View>
        )}
        <FilterChips
          options={PERIOD_OPTIONS}
          value={periodType}
          onChange={setPeriodType}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF5A3C" />
        </View>
      ) : (
        <FlatList
          data={data?.periods ?? []}
          keyExtractor={(item) => item.periodStart}
          renderItem={renderPeriod}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshing={refreshing}
          onRefresh={() => load('refresh')}
          ListEmptyComponent={
            <ListEmpty
              icon="cash-outline"
              message="Este negocio aún no tiene pedidos entregados."
            />
          }
        />
      )}

      <YesNoDialog
        visible={!!toMark}
        destructive={toMark?.settlement?.isPaid ?? false}
        icon={toMark?.settlement?.isPaid ? 'close-circle-outline' : 'cash-outline'}
        title={
          toMark?.settlement?.isPaid ? '¿Deshacer el cobro?' : '¿Marcar como cobrado?'
        }
        message={
          toMark
            ? toMark.settlement?.isPaid
              ? `El período ${periodLabel(toMark)} volverá a "Por cobrar".`
              : `Confirmas que el negocio ya te pagó ${formatPrice(
                  toMark.commissionTotal,
                )} del período ${periodLabel(toMark)}.`
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-dark">{value}</Text>
    </View>
  );
}

/**
 * Pedidos ENTREGADOS de un período (modal): la evidencia de lo que se está
 * cobrando. Usa los filtros de admin de /invoice/paginated.
 */
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
    <Modal
      visible={period != null}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color="#1E1E2D" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-dark">
              Pedidos entregados
            </Text>
            {period && (
              <Text className="text-xs text-muted">{periodLabel(period)}</Text>
            )}
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
              <ActivityIndicator
                size="small"
                color="#FF5A3C"
                style={{ paddingVertical: 12 }}
              />
            ) : null
          }
          ListEmptyComponent={
            list.loading ? (
              <ActivityIndicator
                size="large"
                color="#FF5A3C"
                style={{ paddingTop: 48 }}
              />
            ) : (
              <ListEmpty
                icon="receipt-outline"
                message="No hay pedidos entregados en este período."
              />
            )
          }
        />

        {/* Detalle solo lectura (mismo patrón que Pedidos del admin). */}
        <OrderDetailModal
          orderId={selectedId}
          perspective="business"
          onClose={() => setSelectedId(null)}
        />
      </View>
    </Modal>
  );
}
