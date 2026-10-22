import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { OrderEta } from '@/components/orders/order-eta';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RatingBadge } from '@/components/reviews/star-rating';
import { DEFAULT_BUSINESS_LOGO, DEFAULT_USER_AVATAR } from '@/lib/default-images';
import { formatPrice } from '@/lib/price';
import { orderStateMeta } from '@/lib/order-status';
import { isErrand, Order } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  order: Order;
  /** Título de la tarjeta (negocio para el cliente, cliente para negocio/DELI). */
  title: string;
  /** Icono junto al título (o de respaldo si `logoUri`/`DEFAULT_BUSINESS_LOGO` no aplican). */
  titleIcon?: keyof typeof Ionicons.glyphMap;
  /** Foto/logo del negocio (perspectiva cliente) — para reconocer a quién le pidió. */
  logoUri?: string | null;
  /** Qué foto es `logoUri`: logo de un negocio (default) o avatar de una persona (cliente/domiciliario). */
  avatarKind?: 'business' | 'person';
  onPress: () => void;
  /** Rol que mira la lista: muestra el tiempo estimado vigente en la tarjeta. */
  perspective?: 'client' | 'business' | 'delivery';
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
  logoUri,
  avatarKind = 'business',
  onPress,
  perspective,
  showAddress = false,
  hint,
  action,
}: Props) {
  const colors = useResolvedAppColors();
  const meta = orderStateMeta(order);
  const errand = isErrand(order);
  const itemCount = order.details?.reduce((sum, d) => sum + d.quantity, 0) ?? 0;
  const [working, setWorking] = useState(false);

  async function handleAction() {
    if (working || !action) return;
    try {
      setWorking(true);
      await action.onPress();
    } catch {
      // El interceptor HTTP ya mostró el error (p. ej. otro repartidor tomó
      // el pedido o la transición ya no aplica).
    } finally {
      setWorking(false);
    }
  }

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          {logoUri !== undefined ? (
            <Avatar
              uri={logoUri}
              fallbackSource={
                avatarKind === 'person' ? DEFAULT_USER_AVATAR : DEFAULT_BUSINESS_LOGO
              }
              icon={titleIcon}
              size={28}
              shape={avatarKind === 'person' ? 'circle' : 'rounded'}
            />
          ) : (
            <Ionicons name={titleIcon} size={16} color={colors.mutedColor} />
          )}
          <Text numberOfLines={1} className="flex-1 text-[15px] font-bold text-ink">
            {title}
          </Text>
        </View>
        <Badge label={meta.label} tone={meta.tone} />
      </View>

      {/* Mandado: qué hay que hacer (es lo que decide si tomarlo). */}
      {errand && !!order.errandDescription && (
        <View className="mt-2 flex-row items-start gap-1.5">
          <Ionicons name="clipboard-outline" size={13} color={colors.mutedColor} style={{ marginTop: 1 }} />
          <Text numberOfLines={2} className="flex-1 text-xs text-ink">
            {order.errandDescription}
          </Text>
        </View>
      )}
      {errand && !!order.pickupAddress && showAddress && (
        <View className="mt-1.5 flex-row items-center gap-1.5">
          <Ionicons name="flag-outline" size={13} color={colors.mutedColor} />
          <Text numberOfLines={1} className="flex-1 text-xs text-muted">
            Recoger: {order.pickupAddress}
          </Text>
        </View>
      )}

      {showAddress && (
        <View className="mt-2 flex-row items-center gap-1.5">
          <Ionicons name="location-outline" size={13} color={colors.mutedColor} />
          <Text numberOfLines={1} className="flex-1 text-xs text-muted">
            {order.deliveryAddress}
          </Text>
        </View>
      )}

      <View className="mt-2 flex-row items-center justify-between">
        <Text numberOfLines={1} className="flex-1 pr-2 text-xs text-muted">
          {errand ? 'Mandado' : 'Pedido'} #{order.id}
          {itemCount > 0 ? ` · ${itemCount} art.` : ''}
          {errand && (order.errandPurchaseAmount ?? 0) > 0
            ? ` · compra ${formatPrice(order.errandPurchaseAmount ?? 0)}`
            : ''}
          {order.createdAt ? ` · ${shortDate(order.createdAt)}` : ''}
        </Text>
        {/* Ancho mínimo: ver AmountRow (montos recortados en Android). */}
        <Text
          numberOfLines={1}
          style={{ minWidth: '35%' }}
          className="text-right text-[15px] font-extrabold text-primary"
        >
          {formatPrice(order.total)}
        </Text>
      </View>

      {/* Calificación de las otras partes (el repartidor la ve antes de tomar
          el pedido; el negocio, la del cliente y del repartidor). */}
      {perspective && <PartyRatings order={order} perspective={perspective} />}

      {/* Tiempo estimado vigente (listo aprox. / llega aprox.). */}
      {perspective && <OrderEta order={order} perspective={perspective} compact />}

      {/* Nota de estado (ej. esperando que el negocio despache). */}
      {!!hint && (
        <View className="mt-2.5 flex-row items-center gap-1.5 rounded-xl bg-surface px-3 py-2">
          <Ionicons name="time-outline" size={14} color={colors.mutedColor} />
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

/** "Negocio ★ 4,5 (12) · Cliente ★ Nuevo" — las partes que no son yo. */
function PartyRatings({
  order,
  perspective,
}: {
  order: Order;
  perspective: 'client' | 'business' | 'delivery';
}) {
  const parties = [
    perspective !== 'business' && order.organizational
      ? { label: 'Negocio', rating: order.organizational }
      : null,
    perspective !== 'client' && order.user
      ? { label: 'Cliente', rating: order.user }
      : null,
    perspective !== 'delivery' && order.deliveryUser
      ? { label: 'Domiciliario', rating: order.deliveryUser }
      : null,
  ].filter((p): p is NonNullable<typeof p> => !!p);
  if (!parties.length) return null;

  return (
    <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
      {parties.map((p) => (
        <View key={p.label} className="flex-row items-center gap-1">
          <Text className="text-[11px] text-muted">{p.label}</Text>
          <RatingBadge average={p.rating.ratingAverage} count={p.rating.ratingCount} />
        </View>
      ))}
    </View>
  );
}
