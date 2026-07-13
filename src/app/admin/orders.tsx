import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderCard } from '@/components/orders/order-card';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListEmpty } from '@/components/ui/list-empty';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { OrderStateCode } from '@/lib/order-status';
import { businessDisplayName } from '@/services/explore';
import { Order, ordersService } from '@/services/orders';

type StateFilter = 'all' | OrderStateCode;

const STATE_FILTERS: { value: StateFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'PEND', label: 'Pendientes' },
  { value: 'ACEP', label: 'Aceptados' },
  { value: 'PREP', label: 'Preparando' },
  { value: 'RUTA', label: 'En camino' },
  { value: 'ENTR', label: 'Entregados' },
  { value: 'CANC', label: 'Cancelados' },
];

/**
 * Pedidos de TODA la plataforma (rol ADMIN — el backend no filtra su scope).
 * Solo lectura: supervisar estados, tiempos y montos; las acciones son del
 * negocio/repartidor. Sin socket (el gateway no tiene room de admin):
 * pull-to-refresh.
 */
export default function AdminOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<StateFilter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const list = usePaginatedList<Order>(
    useCallback(
      (params) =>
        ordersService.paginated({
          ...params,
          stateCodes: filter === 'all' ? undefined : [filter],
        }),
      [filter],
    ),
  );

  const title = (order: Order) =>
    order.organizational
      ? `${businessDisplayName(order.organizational)} → ${order.user?.fullName ?? 'Cliente'}`
      : (order.user?.fullName ?? 'Cliente');

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pb-1 pt-3">
        <FilterChips options={STATE_FILTERS} value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            title={title(item)}
            titleIcon="storefront-outline"
            perspective="business"
            showAddress
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
              message="No hay pedidos con este filtro."
            />
          )
        }
      />

      {/* Detalle solo lectura (sin barra de acciones). */}
      <OrderDetailModal
        orderId={selectedId}
        perspective="business"
        onClose={() => setSelectedId(null)}
      />
    </View>
  );
}
