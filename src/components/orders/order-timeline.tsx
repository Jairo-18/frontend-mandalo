import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ORDER_FLOW, ORDER_STATE, stateMeta } from '@/lib/order-status';

type Props = { stateCode: string };

/**
 * Línea de progreso del pedido (PEND → ACEP → PREP → RUTA → ENTR). Si el
 * pedido está cancelado muestra una franja roja en vez del flujo.
 */
export function OrderTimeline({ stateCode }: Props) {
  if (stateCode === 'CANC') {
    const meta = stateMeta('CANC');
    return (
      <View className="flex-row items-center gap-2 rounded-2xl bg-red-50 p-3.5">
        <Ionicons name={meta.icon} size={20} color="#DC2626" />
        <Text className="text-sm font-bold text-red-600">Pedido cancelado</Text>
      </View>
    );
  }

  const currentIndex = ORDER_FLOW.indexOf(stateCode as never);

  return (
    <View className="flex-row items-start justify-between">
      {ORDER_FLOW.map((code, idx) => {
        const done = idx <= currentIndex && currentIndex >= 0;
        const meta = ORDER_STATE[code];
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
          </View>
        );
      })}
    </View>
  );
}
