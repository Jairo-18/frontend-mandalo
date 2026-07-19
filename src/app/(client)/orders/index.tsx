import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { MenuButton } from '@/components/client/menu-button';
import { OrderCard } from '@/components/orders/order-card';
import { PanelHeader } from '@/components/ui/panel-header';
import {
  ORDER_FILTER_CODES,
  OrderFilter,
  OrderFilters,
} from '@/components/orders/order-filters';
import { ListEmpty } from '@/components/ui/list-empty';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useOrderEvents } from '@/lib/orders-socket';
import { businessDisplayName } from '@/services/explore';
import { Order, ordersService } from '@/services/orders';

/**
 * "Mis pedidos" del cliente: historial con scroll infinito, pull-to-refresh,
 * filtros por estado (Todos/En curso/Entregados/Cancelados) y orden por fecha.
 */
export default function ClientOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');

  const list = usePaginatedList<Order>(
    useCallback(
      (params) =>
        ordersService.paginated({
          ...params,
          stateCodes: ORDER_FILTER_CODES[filter],
          order,
        }),
      [filter, order],
    ),
  );

  // Al VOLVER a la pantalla (p. ej. tras crear/cancelar) recarga la 1ª página.
  // El primer focus se salta: usePaginatedList ya hizo la carga inicial al
  // montar (sin esto salían 2 peticiones idénticas al abrir). El ref evita el
  // closure viejo: sin él, el refresh usaría el fetcher del primer render
  // (filtro "Todos") aunque el usuario tenga otro filtro activo.
  const firstFocusRef = useRef(true);
  const refreshRef = useRef(() => {});
  useEffect(() => {
    refreshRef.current = () => list.fetchPage(1, 'refresh');
  });
  useFocusEffect(
    useCallback(() => {
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return;
      }
      refreshRef.current();
    }, []),
  );

  // En vivo: cambios de estado de mis pedidos refrescan la lista.
  useOrderEvents(
    useCallback(() => list.fetchPage(1, 'refresh'), [list.fetchPage]),
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />

      <View className="flex-1 bg-surface">
      <PanelHeader title="Mis pedidos" menu={<MenuButton />} />

      <View className="px-5 pb-2 pt-3">
        <OrderFilters
          filter={filter}
          onFilter={setFilter}
          order={order}
          onOrder={setOrder}
        />
      </View>

      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            perspective="client"
            title={
              item.organizational
                ? businessDisplayName(item.organizational)
                : `Pedido #${item.id}`
            }
            onPress={() =>
              router.push({ pathname: '/orders/[id]', params: { id: String(item.id) } })
            }
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
            <ListEmpty
              icon="receipt-outline"
              message={
                filter === 'all'
                  ? 'Aún no has hecho pedidos. ¡Explora los negocios y pide algo rico!'
                  : 'No tienes pedidos con este filtro.'
              }
            />
          )
        }
      />
      </View>
    </SafeAreaView>
  );
}
