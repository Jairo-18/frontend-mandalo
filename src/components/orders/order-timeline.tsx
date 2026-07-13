import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { formatTime } from '@/lib/order-eta';
import { ORDER_FLOW, ORDER_STATE, OrderStateCode, stateMeta } from '@/lib/order-status';
import { Order } from '@/services/orders';

type Props = { order: Order };

/** Cuándo ocurrió cada paso del flujo (para la hora bajo el icono). */
function stepTime(order: Order, code: OrderStateCode): string | null {
  const iso = {
    PEND: order.createdAt,
    ACEP: order.acceptedAt,
    PREP: order.preparingAt,
    RUTA: order.onRouteAt,
    ENTR: order.deliveredAt,
    CANC: order.cancelledAt,
  }[code];
  return iso ? formatTime(new Date(iso)) : null;
}

/**
 * Línea de progreso del pedido (PEND → ACEP → PREP → RUTA → ENTR) con la hora
 * real en la que ocurrió cada paso. Si el pedido está cancelado muestra una
 * franja roja en vez del flujo.
 */
export function OrderTimeline({ order }: Props) {
  const stateCode = order.stateType?.code ?? '';

  if (stateCode === 'CANC') {
    const meta = stateMeta('CANC');
    const time = stepTime(order, 'CANC');
    return (
      <View className="flex-row items-center gap-2 rounded-2xl bg-red-50 p-3.5">
        <Ionicons name={meta.icon} size={20} color="#DC2626" />
        <Text className="flex-1 text-sm font-bold text-red-600">
          Pedido cancelado
        </Text>
        {!!time && <Text className="text-xs text-red-400">{time}</Text>}
      </View>
    );
  }

  const currentIndex = ORDER_FLOW.indexOf(stateCode as never);

  return (
    <View className="flex-row items-start justify-between">
      {ORDER_FLOW.map((code, idx) => {
        const done = idx <= currentIndex && currentIndex >= 0;
        const meta = ORDER_STATE[code];
        const time = done ? stepTime(order, code) : null;
        return (
          <View key={code} className="flex-1 items-center">
            <View className="w-full flex-row items-center">
              {/* Línea izquierda */}
              <View
                className={`h-0.5 flex-1 ${
                  idx === 0 ? 'opacity-0' : done ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${
                  done ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <Ionicons
                  name={meta.icon}
                  size={15}
                  color={done ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              {/* Línea derecha */}
              <View
                className={`h-0.5 flex-1 ${
                  idx === ORDER_FLOW.length - 1
                    ? 'opacity-0'
                    : idx < currentIndex
                      ? 'bg-primary'
                      : 'bg-gray-200'
                }`}
              />
            </View>
            <Text
              numberOfLines={1}
              className={`mt-1 text-[9px] font-semibold ${
                done ? 'text-primary' : 'text-muted'
              }`}
            >
              {meta.label}
            </Text>
            {!!time && (
              <Text numberOfLines={1} className="text-[9px] text-muted">
                {time}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
