import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AcceptOrderDialog } from '@/components/orders/accept-order-dialog';
import { ActionButton } from '@/components/orders/action-button';
import { CancelOrderDialog } from '@/components/orders/cancel-order-dialog';
import { OrderCard } from '@/components/orders/order-card';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { VerificationCodeDialog } from '@/components/orders/verification-code-dialog';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListEmpty } from '@/components/ui/list-empty';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useOrderEvents } from '@/lib/orders-socket';
import { OrderStateCode } from '@/lib/order-status';
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
 * Pedidos del negocio (rol NEGO). Lista filtrable por estado; al tocar uno se
 * abre el detalle con las acciones del negocio (aceptar, preparar, cancelar).
 * Se actualiza en vivo cuando entra un pedido o cambia de estado.
 */
export default function BusinessOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<StateFilter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [acceptId, setAcceptId] = useState<number | null>(null);
  // Despacho (RUTA): exige el código de recogida que dicta el repartidor.
  const [dispatchId, setDispatchId] = useState<number | null>(null);
  // reload del detalle abierto, para refrescarlo tras aceptar desde el diálogo.
  const detailReload = useRef<(() => void) | null>(null);

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

  // En vivo: cualquier evento de pedido refresca el listado.
  useOrderEvents(
    useCallback(() => list.fetchPage(1, 'refresh'), [list.fetchPage]),
  );

  async function setState(id: number, code: OrderStateCode, reload: () => void) {
    await ordersService.changeState(id, code);
    reload();
    list.fetchPage(1, 'refresh');
  }

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
            title={item.user?.fullName ?? 'Cliente'}
            titleIcon="person-outline"
            perspective="business"
            onPress={() => setSelectedId(item.id)}
          />
        )}
        // La escena del Drawer no aplica el safe area inferior: el inset va
        // en el contenido para que la última tarjeta no quede tras la barra
        // de navegación del sistema.
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
            <ListEmpty icon="receipt-outline" message="Aún no hay pedidos por aquí." />
          )
        }
      />

      <OrderDetailModal
        orderId={selectedId}
        perspective="business"
        onClose={() => setSelectedId(null)}
        onChanged={() => list.fetchPage(1, 'refresh')}
        actions={({ order, reload }) => {
          const code = order.stateType?.code;
          if (code === 'PEND') {
            return (
              <View className="flex-row gap-3">
                <ActionButton
                  label="Cancelar"
                  variant="danger-outline"
                  onPress={() => setCancelId(order.id)}
                />
                <ActionButton
                  label="Aceptar"
                  variant="success"
                  onPress={() => {
                    detailReload.current = reload;
                    setAcceptId(order.id);
                  }}
                />
              </View>
            );
          }
          if (code === 'ACEP') {
            return (
              <View className="flex-row gap-3">
                <ActionButton
                  label="Cancelar"
                  variant="danger-outline"
                  onPress={() => setCancelId(order.id)}
                />
                <ActionButton
                  label="Preparar"
                  onPress={() => setState(order.id, 'PREP', reload)}
                />
              </View>
            );
          }
          if (code === 'PREP') {
            // Con repartidor asignado, el negocio confirma la salida (despacha).
            if (order.deliveryUserId) {
              return (
                <View className="flex-row gap-3">
                  <ActionButton
                    label="Cancelar"
                    variant="danger-outline"
                    onPress={() => setCancelId(order.id)}
                  />
                  <ActionButton
                    label="Entregar al domiciliario"
                    variant="success"
                    onPress={() => {
                      detailReload.current = reload;
                      setDispatchId(order.id);
                    }}
                  />
                </View>
              );
            }
            return (
              <View className="gap-2">
                <Text className="text-center text-xs text-muted">
                  Esperando que un domiciliario tome el pedido…
                </Text>
                <ActionButton
                  label="Cancelar pedido"
                  variant="danger-outline"
                  onPress={() => setCancelId(order.id)}
                />
              </View>
            );
          }
          return null;
        }}
      />

      {/* Despacho verificado: el repartidor dicta su código de recogida. */}
      <VerificationCodeDialog
        visible={dispatchId != null}
        title="Código de recogida"
        message="Pídele al domiciliario el código que ve en su app y digítalo para entregarle el pedido."
        onConfirm={async (verificationCode) => {
          if (dispatchId == null) return;
          await ordersService.changeState(dispatchId, 'RUTA', {
            verificationCode,
          });
          setDispatchId(null);
          detailReload.current?.();
          detailReload.current = null;
          list.fetchPage(1, 'refresh');
        }}
        onCancel={() => setDispatchId(null)}
      />

      {/* El negocio se compromete con un tiempo de preparación al aceptar. */}
      <AcceptOrderDialog
        visible={acceptId != null}
        onConfirm={async (minutes) => {
          if (acceptId == null) return;
          await ordersService.changeState(acceptId, 'ACEP', {
            prepEstimatedMinutes: minutes,
          });
          setAcceptId(null);
          detailReload.current?.();
          detailReload.current = null;
          list.fetchPage(1, 'refresh');
        }}
        onCancel={() => setAcceptId(null)}
      />

      <CancelOrderDialog
        visible={cancelId != null}
        onConfirm={async (reason) => {
          if (cancelId == null) return;
          await ordersService.changeState(cancelId, 'CANC', {
            cancellationReason: reason,
          });
          setCancelId(null);
          setSelectedId(null);
          list.fetchPage(1, 'refresh');
        }}
        onCancel={() => setCancelId(null)}
      />
    </View>
  );
}
