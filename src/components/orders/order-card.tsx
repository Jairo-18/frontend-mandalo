import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/price';
import { stateMeta } from '@/lib/order-status';
import { Order } from '@/services/orders';

type Props = {
  order: Order;
  /** Título de la tarjeta (negocio para el cliente, cliente para negocio/DELI). */
  title: string;
  /** Icono junto al título. */
  titleIcon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Muestra la dirección de entrega (útil en la lista del repartidor). */
  showAddress?: boolean;
  /** Texto de ayuda/estado bajo la tarjeta (ej. "Esperando despacho"). */
  hint?: string;
  /** Botón de acción principal en la tarjeta (tomar, marcar en camino, entregar…). */
  action?: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void | Promise<void>;
    tone?: 'primary' | 'success';
  };
};

/** Fecha corta "9 jul, 2:35 p. m." */
function shortDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Tarjeta de un pedido en un listado. Muestra el estado, el título (según el
 * rol que lo ve), el número de artículos, la fecha y el total.
 */
export function OrderCard({
  order,
  title,
  titleIcon = 'storefront-outline',
  onPress,
  showAddress = false,
  hint,
  action,
}: Props) {
  const meta = stateMeta(order.stateType?.code ?? '');
  const itemCount = order.details?.reduce((sum, d) => sum + d.quantity, 0) ?? 0;
  const [working, setWorking] = useState(false);

  async function handleAction() {
    if (working || !action) return;
    try {
      setWorking(true);
      await action.onPress();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          <Ionicons name={titleIcon} size={16} color="#7A7A8A" />
          <Text numberOfLines={1} className="flex-1 text-[15px] font-bold text-dark">
            {title}
          </Text>
        </View>
        <Badge label={meta.label} tone={meta.tone} />
      </View>

      {showAddress && (
        <View className="mt-2 flex-row items-center gap-1.5">
          <Ionicons name="location-outline" size={13} color="#7A7A8A" />
          <Text numberOfLines={1} className="flex-1 text-xs text-muted">
            {order.deliveryAddress}
          </Text>
        </View>
      )}

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-muted">
          Pedido #{order.id}
          {itemCount > 0 ? ` · ${itemCount} art.` : ''}
          {order.createdAt ? ` · ${shortDate(order.createdAt)}` : ''}
        </Text>
        <Text className="text-[15px] font-extrabold text-primary">
          {formatPrice(order.total)}
        </Text>
      </View>

      {/* Nota de estado (ej. esperando que el negocio despache). */}
      {!!hint && (
        <View className="mt-2.5 flex-row items-center gap-1.5 rounded-xl bg-surface px-3 py-2">
          <Ionicons name="time-outline" size={14} color="#7A7A8A" />
          <Text className="flex-1 text-xs text-muted">{hint}</Text>
        </View>
      )}

      {/* Acción principal en la tarjeta (tomar / en camino / entregar…). */}
      {action && (
        <Pressable
          onPress={handleAction}
          disabled={working}
          className={`mt-3 h-11 flex-row items-center justify-center gap-1.5 rounded-xl active:opacity-80 ${
            action.tone === 'success' ? 'bg-emerald-600' : 'bg-primary'
          } ${working ? 'opacity-70' : ''}`}
        >
          {working ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name={action.icon} size={16} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">{action.label}</Text>
            </>
          )}
        </Pressable>
      )}
    </Pressable>
  );
}
