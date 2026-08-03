import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/orders/action-button';
import { OrderCard } from '@/components/orders/order-card';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { ReportDeliveryFailureDialog } from '@/components/orders/report-delivery-failure-dialog';
import { VerificationCodeDialog } from '@/components/orders/verification-code-dialog';
import { useDeliveryPositionBroadcast } from '@/lib/delivery-tracker';
import {
  ORDER_FILTER_CODES,
  OrderFilter,
  OrderFilters,
} from '@/components/orders/order-filters';
import { ListEmpty } from '@/components/ui/list-empty';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { businessDisplayName } from '@/services/explore';
import { DeviceCoords, getDeviceCoordsSilently } from '@/lib/location';
import { useOrderEvents } from '@/lib/orders-socket';
import { useSession } from '@/hooks/use-session';
import { Order, ordersService } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';

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
  // Filtros de "Mis entregas" (los disponibles no se filtran: van por antigüedad).
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  // Reactivo (regla React Compiler: no leer getSession() suelto en el render).
  const myId = useSession()?.user.id;

  // Posición del repartidor: limita "Disponibles" al radio de cercanía y los
  // ordena por distancia al negocio. Si niega el permiso o no hay fix, la
  // lista sale SIN filtrar (mejor eso que una pantalla vacía).
  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  useEffect(() => {
    getDeviceCoordsSilently().then(setCoords);
  }, []);

  const available = usePaginatedList<Order>(
    useCallback(
      (params) => ordersService.available({ ...params, near: coords }),
      [coords],
    ),
  );
  const mine = usePaginatedList<Order>(
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

  // Tracking en vivo: mientras tenga pedidos EN RUTA, su GPS viaja por el
  // socket al mapa del cliente (se apaga solo al entregar). El permiso de
  // ubicación en segundo plano queda detrás de un aviso propio (abajo, con
  // el YesNoDialog) — Google Play lo exige antes del diálogo del sistema.
  const {
    needsBackgroundDisclosure,
    grantBackgroundConsent,
    declineBackgroundConsent,
  } = useDeliveryPositionBroadcast(
    mine.items
      .filter(
        (o) => o.stateType?.code === 'RUTA' && o.deliveryUserId === myId,
      )
      .map((o) => o.id),
  );

  // En vivo: 'invoice:available'/'invoice:taken' son broadcast a TODOS los
  // repartidores (entra o sale un pedido del pool) — solo afectan
  // "Disponibles". 'invoice:updated' llega SOLO al repartidor asignado
  // (emitToDelivery singular del backend) — siempre es sobre uno de "Mis
  // entregas". Antes esto refrescaba las DOS listas ante cualquier evento de
  // CUALQUIER negocio de la plataforma (auditoría de peticiones).
  useOrderEvents(
    useCallback(
      (_payload, event) => {
        if (event === 'invoice:available' || event === 'invoice:taken') {
          available.fetchPage(1, 'refresh');
        } else {
          mine.fetchPage(1, 'refresh');
        }
      },
      [available.fetchPage, mine.fetchPage],
    ),
  );

  /**
   * Tomar un pedido disponible directo desde la tarjeta. Al tomarlo con
   * éxito, el backend hace broadcast de 'invoice:taken' a TODOS los
   * repartidores (incluido este) — "Disponibles" se refresca solo con ese
   * eco; acá solo hace falta refrescar "Mis entregas" a mano (no hay otro
   * aviso de que este pedido ya es mío). Si falla (otro lo tomó primero), no
   * hay un eco nuevo para MI intento fallido — se refresca "Disponibles" a
   * mano para sacar el pedido stale de la lista.
   */
  async function take(id: number) {
    try {
      await ordersService.take(id);
      mine.fetchPage(1, 'refresh');
    } catch {
      // El interceptor ya mostró el error.
      available.fetchPage(1, 'refresh');
    }
  }

  // Entrega verificada: pide el código que el CLIENTE ve en su app.
  const [deliverTarget, setDeliverTarget] = useState<{ id: number } | null>(
    null,
  );
  // Entrega fallida (Art. 31-32 TYC, NOTAS §59): pide el motivo, después el
  // pedido queda esperando que el CLIENTE decida reintentar o cancelar.
  const [failureTarget, setFailureTarget] = useState<{ id: number } | null>(
    null,
  );

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
        onPress: () => setDeliverTarget({ id: order.id }),
        tone: 'success' as const,
      };
    }
    return undefined;
  }

  /** Nota de estado para mis entregas aún no despachadas por el negocio. */
  function cardHint(order: Order): string | undefined {
    if (tab === 'mine' && order.stateType?.code === 'PREP') {
      // El código de recogida es SU llave: se lo dicta al negocio al recoger.
      return order.pickupCode
        ? `Ve por el pedido y dile al negocio tu código de recogida: ${order.pickupCode}`
        : 'Ve por el pedido. El negocio confirmará la salida cuando te lo entregue.';
    }
    return undefined;
  }

  const list = tab === 'available' ? available : mine;
  const bizName = (order: Order) =>
    order.organizational ? businessDisplayName(order.organizational) : 'Negocio';

  return (
    <View className="flex-1 bg-surface">
      {/* Pestañas: más separación del navbar de arriba ("Repartir"). */}
      <View className="flex-row gap-2 px-4 pb-2 pt-4">
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

      {tab === 'mine' && (
        <View className="px-4 pb-2">
          <OrderFilters
            filter={filter}
            onFilter={setFilter}
            order={order}
            onOrder={setOrder}
          />
        </View>
      )}

      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            title={bizName(item)}
            titleIcon="storefront-outline"
            perspective="delivery"
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
            <ActivityIndicator size="small" color={getAppColors().primaryColor} style={{ paddingVertical: 12 }} />
          ) : null
        }
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator size="large" color={getAppColors().primaryColor} style={{ paddingTop: 48 }} />
          ) : (
            <ListEmpty
              icon={tab === 'available' ? 'bicycle-outline' : 'cube-outline'}
              message={
                tab === 'available'
                  ? coords
                    ? 'No hay pedidos disponibles cerca de ti. ¡Vuelve a revisar en un momento!'
                    : 'No hay pedidos disponibles ahora. ¡Vuelve a revisar en un momento!'
                  : filter === 'all'
                    ? 'Aún no has tomado pedidos.'
                    : 'No tienes entregas con este filtro.'
              }
            />
          )
        }
      />

      <OrderDetailModal
        orderId={selectedId}
        perspective="delivery"
        onClose={() => setSelectedId(null)}
        actions={({ order, close }) => {
          const code = order.stateType?.code;
          // Pedido disponible (listo, sin repartidor): se puede tomar.
          if (!order.deliveryUserId && code === 'PREP') {
            return (
              <ActionButton
                label="Tomar pedido"
                onPress={async () => {
                  try {
                    await ordersService.take(order.id);
                    mine.fetchPage(1, 'refresh');
                  } catch {
                    // El interceptor ya mostró el error.
                    available.fetchPage(1, 'refresh');
                  } finally {
                    close();
                  }
                }}
              />
            );
          }
          // Pedido mío ya despachado por el negocio: se puede entregar o,
          // si no se pudo, reportarlo (queda esperando al cliente).
          if (order.deliveryUserId === myId && code === 'RUTA') {
            return (
              <View className="flex-row gap-3">
                <ActionButton
                  label="No se pudo entregar"
                  variant="danger-outline"
                  onPress={() => setFailureTarget({ id: order.id })}
                />
                <ActionButton
                  label="Marcar entregado"
                  variant="success"
                  onPress={() => setDeliverTarget({ id: order.id })}
                />
              </View>
            );
          }
          return null;
        }}
      />

      {/* Entrega verificada: el cliente dicta su código de entrega. Solo
          "Mis entregas" cambia (el pedido nunca vuelve a "Disponibles"); el
          detalle abierto (si lo hay) se autoactualiza con su propio socket. */}
      <VerificationCodeDialog
        visible={deliverTarget != null}
        title="Código de entrega"
        message="Pídele al cliente el código que ve en su app y digítalo para confirmar la entrega."
        onConfirm={async (verificationCode) => {
          if (!deliverTarget) return;
          await ordersService.changeState(deliverTarget.id, 'ENTR', {
            verificationCode,
          });
          mine.fetchPage(1, 'refresh');
          setDeliverTarget(null);
        }}
        onCancel={() => setDeliverTarget(null)}
      />

      {/* Reporte de entrega fallida: solo "Mis entregas" cambia (el pedido
          queda esperando al cliente, no vuelve a "Disponibles"). */}
      <ReportDeliveryFailureDialog
        visible={failureTarget != null}
        onConfirm={async (failureReason) => {
          if (!failureTarget) return;
          await ordersService.changeState(failureTarget.id, 'FALL', {
            failureReason,
          });
          mine.fetchPage(1, 'refresh');
          setFailureTarget(null);
        }}
        onCancel={() => setFailureTarget(null)}
      />

      {/*
        Aviso PROPIO antes de pedir "Permitir todo el tiempo" al sistema
        (exigido por Google Play para el permiso de ubicación en segundo
        plano, ver NOTAS.md §47/§49): explica qué se recoge y para qué ANTES
        de que aparezca el diálogo nativo. Si declina, sigue funcionando con
        ubicación de primer plano (mientras tenga la app abierta).
      */}
      <YesNoDialog
        visible={needsBackgroundDisclosure}
        icon="navigate-outline"
        title="Ubicación en segundo plano"
        message="Para que el cliente vea en vivo dónde va su pedido —incluso con la pantalla bloqueada o Mándalo en segundo plano— necesitamos tu ubicación exacta mientras tengas una entrega EN CAMINO. Se activa solo con pedidos asignados a ti y se apaga sola al entregar. Puedes revisar cómo tratamos tus datos en Política de Privacidad, dentro de Mi perfil."
        confirmLabel="Activar ubicación"
        cancelLabel="Ahora no"
        onConfirm={grantBackgroundConsent}
        onCancel={declineBackgroundConsent}
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
        active ? 'border-primary bg-primary-tint' : 'border-border bg-card'
      }`}
    >
      <Ionicons
        name={label === 'Disponibles' ? 'bicycle-outline' : 'checkbox-outline'}
        size={16}
        color={active ? getAppColors().primaryColor : getAppColors().mutedColor}
      />
      <Text
        className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-muted'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
