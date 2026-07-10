import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/orders/action-button';
import { OrderCard } from '@/components/orders/order-card';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { ListEmpty } from '@/components/ui/list-empty';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { businessDisplayName } from '@/services/explore';
import { useOrderEvents } from '@/lib/orders-socket';
import { OrderStateCode } from '@/lib/order-status';
import { getSession } from '@/lib/session';
import { Order, ordersService } from '@/services/orders';

type Tab = 'available' | 'mine';

/**
 * Experiencia del repartidor activo: dos pestañas — "Disponibles" (pedidos
 * listos para recoger que puede tomar) y "Mis entregas" (los que tomó, para
 * marcarlos en camino y entregados). Se actualiza en vivo.
 */
export function DeliveryOrders() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('available');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const myId = getSession()?.user.id;

  const available = usePaginatedList<Order>(
    useCallback((params) => ordersService.available(params), []),
  );
  const mine = usePaginatedList<Order>(
    useCallback((params) => ordersService.paginated(params), []),
  );

  const refreshAll = useCallback(() => {
    available.fetchPage(1, 'refresh');
    mine.fetchPage(1, 'refresh');
  }, [available.fetchPage, mine.fetchPage]);

  // En vivo: pedidos que entran/salen de disponibles o cambian de estado.
  useOrderEvents(useCallback(() => refreshAll(), [refreshAll]));

  async function setState(id: number, code: OrderStateCode, reload: () => void) {
    await ordersService.changeState(id, code);
    reload();
    refreshAll();
  }

  /** Tomar un pedido disponible directo desde la tarjeta. */
  async function take(id: number) {
    await ordersService.take(id);
    refreshAll();
  }

  /** Marca mi entrega como entregada al cliente (RUTA→entregado). */
  async function deliver(order: Order) {
    await ordersService.changeState(order.id, 'ENTR');
    refreshAll();
  }

  /**
   * Acción de la tarjeta según la pestaña y el estado. El repartidor NO marca
   * "en camino": eso lo despacha el negocio (confirma que el pedido salió).
   * El repartidor solo toma y, cuando el negocio despacha (RUTA), entrega.
   */
  function cardAction(order: Order) {
    if (tab === 'available') {
      return {
        label: 'Tomar pedido',
        icon: 'bicycle' as const,
        onPress: () => take(order.id),
      };
    }
    if (order.stateType?.code === 'RUTA') {
      return {
        label: 'Marcar entregado',
        icon: 'checkmark-done-outline' as const,
        onPress: () => deliver(order),
        tone: 'success' as const,
      };
    }
    return undefined;
  }

  /** Nota de estado para mis entregas aún no despachadas por el negocio. */
  function cardHint(order: Order): string | undefined {
    if (tab === 'mine' && order.stateType?.code === 'PREP') {
      return 'Ve por el pedido. El negocio confirmará la salida cuando te lo entregue.';
    }
    return undefined;
  }

  const list = tab === 'available' ? available : mine;
  const bizName = (order: Order) =>
    order.organizational ? businessDisplayName(order.organizational) : 'Negocio';

  return (
    <View className="flex-1 bg-surface">
      {/* Pestañas */}
      <View className="flex-row gap-2 px-4 pb-2 pt-1">
        <TabButton
          label="Disponibles"
          active={tab === 'available'}
          onPress={() => setTab('available')}
        />
        <TabButton
          label="Mis entregas"
          active={tab === 'mine'}
          onPress={() => setTab('mine')}
        />
      </View>

      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            title={bizName(item)}
            titleIcon="storefront-outline"
            onPress={() => setSelectedId(item.id)}
            showAddress
            hint={cardHint(item)}
            action={cardAction(item)}
          />
        )}
        // La pantalla solo aplica el safe area de arriba (edges top): el
        // inset inferior va aquí para que la última tarjeta no quede debajo
        // de la barra de navegación del sistema.
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
              icon={tab === 'available' ? 'bicycle-outline' : 'cube-outline'}
              message={
                tab === 'available'
                  ? 'No hay pedidos disponibles ahora. ¡Vuelve a revisar en un momento!'
                  : 'Aún no has tomado pedidos.'
              }
            />
          )
        }
      />

      <OrderDetailModal
        orderId={selectedId}
        perspective="delivery"
        onClose={() => setSelectedId(null)}
        onChanged={refreshAll}
        actions={({ order, reload, close }) => {
          const code = order.stateType?.code;
          // Pedido disponible (listo, sin repartidor): se puede tomar.
          if (!order.deliveryUserId && code === 'PREP') {
            return (
              <ActionButton
                label="Tomar pedido"
                onPress={async () => {
                  await ordersService.take(order.id);
                  refreshAll();
                  close();
                }}
              />
            );
          }
          // Pedido mío ya despachado por el negocio: se puede entregar.
          if (order.deliveryUserId === myId && code === 'RUTA') {
            return (
              <ActionButton
                label="Marcar entregado"
                variant="success"
                onPress={() => setState(order.id, 'ENTR', reload)}
              />
            );
          }
          return null;
        }}
      />
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full border py-2.5 active:opacity-70 ${
        active ? 'border-primary bg-primary-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <Ionicons
        name={label === 'Disponibles' ? 'bicycle-outline' : 'checkbox-outline'}
        size={16}
        color={active ? '#FF5A3C' : '#7A7A8A'}
      />
      <Text
        className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-muted'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
