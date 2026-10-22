import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { OrderCard } from '@/components/orders/order-card';
import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';
import {
  ORDER_FILTER_CODES,
  OrderFilter,
  OrderFilters,
} from '@/components/orders/order-filters';
import { ListEmpty } from '@/components/ui/list-empty';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useOrderEvents, useSocketReconnected } from '@/lib/orders-socket';
import { consumeClientOrdersStale } from '@/lib/orders-stale';
import { businessDisplayName } from '@/services/explore';
import { isErrand, Order, ordersService } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';

/**
 * "Mis pedidos" del cliente: historial con scroll infinito, pull-to-refresh,
 * filtros por estado (Todos/En curso/Entregados/Cancelados) y orden por fecha.
 */
export default function ClientOrdersScreen() {
  const router = useRouter();
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

  // NO recarga en cada visita: se actualiza en vivo por socket (en silencio,
  // sin spinner) y con deslizar hacia abajo. Solo al volver tras crear un
  // pedido (el socket no le avisa al cliente de su propio pedido nuevo) se
  // recarga, también en silencio. El ref evita el closure viejo: sin él
  // usaría el fetcher del primer render aunque haya otro filtro activo.
  const silentRefreshRef = useRef(() => {});
  useEffect(() => {
    silentRefreshRef.current = () => list.fetchPage(1, 'silent');
  });
  useFocusEffect(
    useCallback(() => {
      if (consumeClientOrdersStale()) silentRefreshRef.current();
    }, []),
  );

  // En vivo: cambios de estado de mis pedidos refrescan la lista.
  useOrderEvents(
    useCallback(() => list.fetchPage(1, 'silent'), [list.fetchPage]),
  );
  // Si el socket se cayó (wifi/datos) y volvió, pudo perderse algún evento
  // mientras estuvo desconectado.
  useSocketReconnected(
    useCallback(() => list.fetchPage(1, 'silent'), [list.fetchPage]),
  );

  return (
    <PanelSafeArea>
      <StatusBar style="light" />

      <View className="flex-1 bg-surface">
      <PanelHeader
        title="Mis pedidos"
        right={
          // "Pedir un mandado": para quien ya conoce el servicio (también
          // está la tarjeta del home).
          <Pressable
            onPress={() => router.push('/errand')}
            hitSlop={6}
            className="h-9 flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 active:opacity-70"
          >
            <Ionicons name="walk-outline" size={16} color="#FFFFFF" />
            <Text className="text-[13px] font-bold text-white">Mandado</Text>
          </Pressable>
        }
      />

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
              isErrand(item)
                ? item.errandDescription || 'Mandado'
                : item.organizational
                  ? businessDisplayName(item.organizational)
                  : `Pedido #${item.id}`
            }
            titleIcon={isErrand(item) ? 'walk-outline' : undefined}
            // Mandado: sin logo (no hay negocio) → el icono.
            logoUri={isErrand(item) ? undefined : item.organizational?.logoUrl}
            onPress={() =>
              router.push({ pathname: '/orders/[id]', params: { id: String(item.id) } })
            }
          />
        )}
        // Fijo, sin sumar insets.bottom: esta pantalla vive dentro del menú
        // inferior de Tabs, que ya reserva el inset real por su cuenta.
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshing={list.refreshing}
        onRefresh={() => list.fetchPage(1, 'refresh')}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator size="small" color={getAppColors().primaryColor} style={{ paddingVertical: 12 }} />
          ) : null
        }
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator size="large" color={getAppColors().primaryColor} style={{ paddingTop: 48 }} />
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
    </PanelSafeArea>
  );
}
