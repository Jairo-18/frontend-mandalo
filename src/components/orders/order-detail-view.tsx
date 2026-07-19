import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';

import { OrderEta } from '@/components/orders/order-eta';
import { OrderMap } from '@/components/orders/order-map';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { Avatar } from '@/components/ui/avatar';
import { pickPhoto } from '@/lib/pick-photo';
import { formatPrice } from '@/lib/price';
import { businessDisplayName } from '@/services/explore';
import { Order, ordersService } from '@/services/orders';

type Perspective = 'client' | 'business' | 'delivery';

type Props = {
  order: Order;
  /** Quién mira: define qué contactos se muestran. */
  perspective: Perspective;
  /** El cliente subió/cambió el soporte de pago (para recargar el pedido). */
  onPaymentProofChanged?: () => void;
};

/**
 * Cuerpo (scrolleable) del detalle de un pedido, común a los 3 roles: línea
 * de progreso, contactos relevantes, dirección, artículos, pago y totales.
 * Los botones de acción los pone cada pantalla como barra inferior.
 */
export function OrderDetailView({
  order,
  perspective,
  onPaymentProofChanged,
}: Props) {
  const router = useRouter();
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofViewerOpen, setProofViewerOpen] = useState(false);

  const businessName = order.organizational
    ? businessDisplayName(order.organizational)
    : 'Negocio';

  // Soporte de pago: solo aplica a métodos distintos a efectivo. El cliente
  // dueño puede subirlo/cambiarlo mientras el pedido no esté cancelado; el
  // repartidor no lo necesita (el cobro es asunto cliente ↔ negocio).
  const paidInCash = order.paidType?.code === 'EFEC';
  const canAttachProof =
    perspective === 'client' &&
    !paidInCash &&
    order.stateType?.code !== 'CANC';
  const showProofSection =
    perspective !== 'delivery' && (!!order.paymentProofUrl || canAttachProof);

  function attachProof() {
    pickPhoto('Soporte de pago', async (uri) => {
      setUploadingProof(true);
      try {
        await ordersService.uploadPaymentProof(order.id, uri);
        onPaymentProofChanged?.();
      } catch {
        // El interceptor HTTP ya mostró el error.
      } finally {
        setUploadingProof(false);
      }
    });
  }

  // Chat cliente ↔ repartidor: existe desde que hay repartidor asignado
  // (queda de solo lectura al finalizar; la pantalla del chat lo maneja).
  const chatAvailable = perspective !== 'business' && !!order.deliveryUser;

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

      {/* Chat con la contraparte (cliente ↔ repartidor) */}
      {chatAvailable && (
        <Pressable
          onPress={() => router.push(`/chat/${order.id}`)}
          className="mb-3 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-dark active:opacity-80"
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
          <Text className="text-[15px] font-bold text-white">
            {perspective === 'client'
              ? 'Chatear con el repartidor'
              : 'Chatear con el cliente'}
          </Text>
        </Pressable>
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

        {/* Soporte de pago (transferencia/Nequi/Daviplata): el cliente lo
            sube, el negocio lo revisa. Toca la imagen para verla completa. */}
        {showProofSection && (
          <View className="mt-3 border-t border-gray-200 pt-3">
            <Text className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">
              Soporte de pago
            </Text>

            {order.paymentProofUrl ? (
              <Pressable
                onPress={() => setProofViewerOpen(true)}
                className="h-44 overflow-hidden rounded-xl border border-gray-200 bg-white active:opacity-80"
              >
                <Image
                  source={{ uri: order.paymentProofUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-full bg-dark/70 px-2.5 py-1">
                  <Ionicons name="expand-outline" size={12} color="#FFFFFF" />
                  <Text className="text-[11px] font-bold text-white">Ver</Text>
                </View>
              </Pressable>
            ) : (
              <Text className="text-[13px] text-muted">
                {perspective === 'client'
                  ? 'Aún no has subido el comprobante del pago.'
                  : 'El cliente aún no sube el comprobante del pago.'}
              </Text>
            )}

            {canAttachProof && (
              <Pressable
                onPress={attachProof}
                disabled={uploadingProof}
                className={`mt-2.5 h-11 flex-row items-center justify-center gap-2 rounded-xl border border-primary active:opacity-70 ${
                  uploadingProof ? 'opacity-60' : ''
                }`}
              >
                {uploadingProof ? (
                  <ActivityIndicator size="small" color="#FF5A3C" />
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={16} color="#FF5A3C" />
                    <Text className="text-[14px] font-bold text-primary">
                      {order.paymentProofUrl
                        ? 'Cambiar soporte de pago'
                        : 'Subir soporte de pago'}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Visor a pantalla completa del soporte de pago */}
      <Modal
        visible={proofViewerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setProofViewerOpen(false)}
        statusBarTranslucent
      >
        <View className="flex-1 items-center justify-center bg-black/90">
          {!!order.paymentProofUrl && (
            <Image
              source={{ uri: order.paymentProofUrl }}
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          )}
          <Pressable
            onPress={() => setProofViewerOpen(false)}
            hitSlop={12}
            className="absolute right-5 top-14 h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>

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
