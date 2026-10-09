import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeleteOrderDialog } from '@/components/orders/delete-order-dialog';
import { OrderCard } from '@/components/orders/order-card';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListEmpty } from '@/components/ui/list-empty';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { OrderStateCode } from '@/lib/order-status';
import { businessDisplayName } from '@/services/explore';
import { Order, ordersService } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';

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
 * Pedidos de la plataforma (ADMIN/SUPERADMIN; el admin regional solo ve los
 * de su municipio). Supervisar estados, tiempos y montos; las acciones del
 * flujo son del negocio/repartidor. La única acción del admin es ELIMINAR un
 * pedido (limpiar pruebas), con confirmación. Sin socket (el gateway no tiene
 * room de admin): pull-to-refresh.
 */
export default function AdminOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<StateFilter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Order | null>(null);

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
        <View className="flex-row items-center gap-2.5">
          <View className="flex-1">
            <FilterChips options={STATE_FILTERS} value={filter} onChange={setFilter} />
          </View>
          <ThemeToggle />
        </View>
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
              color={getAppColors().primaryColor}
              style={{ paddingVertical: 12 }}
            />
          ) : null
        }
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator
              size="large"
              color={getAppColors().primaryColor}
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

      {/* Detalle de solo lectura + eliminar (con confirmación). */}
      <OrderDetailModal
        orderId={selectedId}
        perspective="business"
        onClose={() => {
          setToDelete(null);
          setSelectedId(null);
        }}
        actions={({ order }) => (
          <Pressable
            onPress={() => setToDelete(order)}
            className="h-[48px] flex-row items-center justify-center gap-2 rounded-2xl border border-red-300 active:opacity-70"
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text className="text-[15px] font-bold text-red-600">Eliminar pedido</Text>
          </Pressable>
        )}
        overlay={
          <DeleteOrderDialog
            key={toDelete?.id ?? 'none'}
            order={toDelete}
            onCancel={() => setToDelete(null)}
            onConfirm={async () => {
              if (!toDelete) return;
              await ordersService.remove(toDelete.id);
              list.removeItem(toDelete.id);
              setToDelete(null);
              setSelectedId(null);
            }}
          />
        }
      />
    </View>
  );
}
