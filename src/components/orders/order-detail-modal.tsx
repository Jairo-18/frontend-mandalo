import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderDetailView } from '@/components/orders/order-detail-view';
import { useOrderEvents } from '@/lib/orders-socket';
import { Order, ordersService } from '@/services/orders';

/** Contexto que reciben los botones de acción (según el rol). */
export type OrderActionCtx = {
  order: Order;
  /** Recarga el detalle (tras cambiar de estado). */
  reload: () => void;
  /** Cierra el modal. */
  close: () => void;
};

type Props = {
  /** Pedido a mostrar; null cierra el modal. */
  orderId: number | null;
  perspective: 'business' | 'delivery';
  onClose: () => void;
  /** Un cambio de estado ocurrió (para que el listado detrás se refresque). */
  onChanged?: () => void;
  /** Botones de acción del rol (aceptar/preparar/tomar/entregar/cancelar…). */
  actions?: (ctx: OrderActionCtx) => ReactNode;
};

/**
 * Detalle de un pedido a pantalla completa (modal), reutilizado por el panel
 * del negocio y del repartidor. Carga el pedido por id (el listado no trae los
 * renglones), se actualiza en vivo y deja que cada rol ponga sus acciones.
 */
export function OrderDetailModal({
  orderId,
  perspective,
  onClose,
  onChanged,
  actions,
}: Props) {
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (orderId == null) return;
    try {
      const res = await ordersService.get(orderId);
      setOrder(res.data);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId != null) {
      setLoading(true);
      setOrder(null);
      load();
    }
  }, [orderId, load]);

  // En vivo: si cambia ESTE pedido, recarga y avisa al listado.
  useOrderEvents(
    useCallback(
      (payload) => {
        if (payload.id === orderId) {
          load();
          onChanged?.();
        }
      },
      [orderId, load, onChanged],
    ),
  );

  function reloadAndNotify() {
    load();
    onChanged?.();
  }

  return (
    <Modal
      visible={orderId != null}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color="#1E1E2D" />
          </Pressable>
          <Text className="text-lg font-extrabold text-dark">
            Pedido #{orderId}
          </Text>
        </View>

        {loading || !order ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF5A3C" />
          </View>
        ) : (
          (() => {
            // Se evalúa primero: si el rol no tiene acciones para este estado
            // (p. ej. pedido entregado) no se pinta la barra vacía, y el
            // scroll asume el inset inferior del sistema.
            const actionContent = actions
              ? actions({ order, reload: reloadAndNotify, close: onClose })
              : null;
            return (
              <>
                <ScrollView
                  contentContainerStyle={
                    actionContent ? undefined : { paddingBottom: insets.bottom + 12 }
                  }
                >
                  <OrderDetailView order={order} perspective={perspective} />
                </ScrollView>
                {actionContent && (
                  <View
                    className="border-t border-gray-100 bg-white px-5 pt-3"
                    style={{ paddingBottom: insets.bottom + 12 }}
                  >
                    {actionContent}
                  </View>
                )}
              </>
            );
          })()
        )}
      </View>
    </Modal>
  );
}
