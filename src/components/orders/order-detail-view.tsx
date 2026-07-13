import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { OrderEta } from '@/components/orders/order-eta';
import { OrderMap } from '@/components/orders/order-map';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { Avatar } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/price';
import { businessDisplayName } from '@/services/explore';
import { Order } from '@/services/orders';

type Perspective = 'client' | 'business' | 'delivery';

type Props = {
  order: Order;
  /** Quién mira: define qué contactos se muestran. */
  perspective: Perspective;
};

/**
 * Cuerpo (scrolleable) del detalle de un pedido, común a los 3 roles: línea
 * de progreso, contactos relevantes, dirección, artículos, pago y totales.
 * Los botones de acción los pone cada pantalla como barra inferior.
 */
export function OrderDetailView({ order, perspective }: Props) {
  const businessName = order.organizational
    ? businessDisplayName(order.organizational)
    : 'Negocio';

  return (
    <View className="p-5">
      {/* Progreso + estimado vigente */}
      <View className="mb-5 rounded-2xl bg-white p-4">
        <OrderTimeline order={order} />
        <OrderEta order={order} perspective={perspective} />
      </View>

      {/* Mapa en vivo (cliente y repartidor): negocio, entrega y la moto en
          RUTA. El negocio no lo necesita (el pedido sale de su local). */}
      {perspective !== 'business' &&
        ['ACEP', 'PREP', 'RUTA'].includes(order.stateType?.code ?? '') && (
          <OrderMap order={order} perspective={perspective} />
        )}

      {/* Códigos del flujo físico: el backend manda a cada rol SOLO el suyo. */}
      {perspective === 'delivery' &&
        !!order.pickupCode &&
        order.stateType?.code === 'PREP' && (
          <CodeBanner
            label="Tu código de recogida"
            code={order.pickupCode}
            caption="Díctaselo al negocio cuando recojas el pedido."
          />
        )}
      {perspective === 'client' &&
        !!order.deliveryCode &&
        ['ACEP', 'PREP', 'RUTA'].includes(order.stateType?.code ?? '') && (
          <CodeBanner
            label="Tu código de entrega"
            code={order.deliveryCode}
            caption="Díctaselo al repartidor cuando recibas tu pedido."
          />
        )}

      {!!order.cancellationReason && (
        <View className="mb-5 flex-row gap-2 rounded-2xl bg-red-50 p-3.5">
          <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
          <Text className="flex-1 text-[13px] text-red-600">
            Motivo: {order.cancellationReason}
          </Text>
        </View>
      )}

      {/* Contactos */}
      {perspective !== 'business' && (
        <ContactRow
          icon="storefront-outline"
          label={businessName}
          detail={order.organizational?.phone || order.organizational?.address}
        />
      )}
      {perspective !== 'client' && order.user && (
        <ContactRow
          icon="person-outline"
          label={order.user.fullName}
          detail={order.user.phone}
          caption="Cliente"
        />
      )}
      {order.deliveryUser && perspective !== 'delivery' && (
        <ContactRow
          icon="bicycle-outline"
          label={order.deliveryUser.fullName}
          detail={order.deliveryUser.phone}
          caption="Repartidor"
        />
      )}

      {/* Dirección de entrega */}
      <Text className="mb-2 mt-1 text-sm font-bold text-gray-700">
        Dirección de entrega
      </Text>
      <View className="mb-5 flex-row gap-2.5 rounded-2xl bg-surface p-3.5">
        <Ionicons name="location" size={18} color="#FF5A3C" />
        <View className="flex-1">
          <Text className="text-[14px] font-semibold text-dark">
            {order.deliveryAddress}
          </Text>
          {!!order.deliveryDetails && (
            <Text className="text-xs text-muted">{order.deliveryDetails}</Text>
          )}
        </View>
      </View>

      {/* Artículos */}
      <Text className="mb-2 text-sm font-bold text-gray-700">Artículos</Text>
      <View className="mb-5 rounded-2xl bg-surface p-3.5">
        {(order.details ?? []).map((detail, idx) => (
          <View
            key={detail.id}
            className={`flex-row items-center gap-2.5 ${idx > 0 ? 'mt-2.5' : ''}`}
          >
            {/* Foto del producto (si el negocio lo borró, queda el icono). */}
            <Avatar
              uri={detail.product?.images?.[0]}
              icon="cube-outline"
              size={40}
              shape="rounded"
            />
            <Text className="text-[13px] font-extrabold text-primary">
              {detail.quantity}×
            </Text>
            <Text numberOfLines={1} className="flex-1 text-[13px] text-dark">
              {detail.productName}
              {detail.discount > 0 ? ` (-${detail.discount}%)` : ''}
            </Text>
            <Text className="text-[13px] font-semibold text-dark">
              {formatPrice(detail.lineTotal)}
            </Text>
          </View>
        ))}
      </View>

      {/* Pago + nota */}
      <View className="mb-5 rounded-2xl bg-surface p-3.5">
        <View className="flex-row items-center gap-2">
          <Ionicons name="cash-outline" size={16} color="#7A7A8A" />
          <Text className="text-[13px] text-dark">
            Pago: {order.paidType?.name ?? '—'} (contra-entrega)
          </Text>
        </View>
        {!!order.notes && (
          <View className="mt-2 flex-row items-start gap-2">
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#7A7A8A" />
            <Text className="flex-1 text-[13px] text-dark">{order.notes}</Text>
          </View>
        )}
      </View>

      {/* Totales */}
      <View className="rounded-2xl bg-white p-4">
        <TotalRow label="Subtotal" value={formatPrice(order.subtotal)} />
        <TotalRow label="Domicilio" value={formatPrice(order.deliveryFee)} />
        <View className="my-2 h-px bg-gray-100" />
        <TotalRow label="Total" value={formatPrice(order.total)} bold />
      </View>
    </View>
  );
}

function ContactRow({
  icon,
  label,
  detail,
  caption,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string | null;
  caption?: string;
}) {
  return (
    <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-tint">
        <Ionicons name={icon} size={18} color="#FF5A3C" />
      </View>
      <View className="flex-1">
        {!!caption && (
          <Text className="text-[10px] font-bold uppercase tracking-wide text-muted">
            {caption}
          </Text>
        )}
        <Text numberOfLines={1} className="text-[14px] font-bold text-dark">
          {label}
        </Text>
        {!!detail && (
          <Text numberOfLines={1} className="text-xs text-muted">
            {detail}
          </Text>
        )}
      </View>
    </View>
  );
}

function TotalRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={
          bold ? 'text-base font-extrabold text-dark' : 'text-sm text-muted'
        }
      >
        {label}
      </Text>
      <Text
        className={
          bold
            ? 'text-base font-extrabold text-primary'
            : 'text-sm font-semibold text-dark'
        }
      >
        {value}
      </Text>
    </View>
  );
}

/** Código de verificación en grande (recogida del DELI / entrega del cliente). */
function CodeBanner({
  label,
  code,
  caption,
}: {
  label: string;
  code: string;
  caption: string;
}) {
  return (
    <View className="mb-5 items-center rounded-2xl bg-primary-tint p-4">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-primary">
        {label}
      </Text>
      <Text className="mt-1 text-3xl font-extrabold tracking-[8px] text-dark">
        {code}
      </Text>
      <Text className="mt-1 text-center text-xs text-muted">{caption}</Text>
    </View>
  );
}
