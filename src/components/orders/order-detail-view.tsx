import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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

import { ArrivalCountdown } from '@/components/orders/arrival-countdown';
import { OrderEta } from '@/components/orders/order-eta';
import { OrderMap } from '@/components/orders/order-map';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { Avatar } from '@/components/ui/avatar';
import { PhotoActionsSheet } from '@/components/ui/photo-actions-sheet';
import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';
import { pickPhoto } from '@/lib/pick-photo';
import { formatPrice } from '@/lib/price';
import { toast } from '@/lib/toast';
import { DEFAULT_BUSINESS_LOGO, DEFAULT_PRODUCT_IMAGE } from '@/lib/default-images';
import { businessDisplayName } from '@/services/explore';
import { Order, ordersService } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Perspective = 'client' | 'business' | 'delivery';

type Props = {
  order: Order;
  /** Quién mira: define qué contactos se muestran. */
  perspective: Perspective;
  /** El cliente subió/cambió el soporte de pago (para recargar el pedido). */
  onPaymentProofChanged?: () => void;
  /** El cliente decidió algo tras una entrega fallida (reintentar/cancelar). */
  onOrderChanged?: () => void;
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
  onOrderChanged,
}: Props) {
  const colors = useResolvedAppColors();
  const router = useRouter();
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofViewerOpen, setProofViewerOpen] = useState(false);
  const [proofMenuVisible, setProofMenuVisible] = useState(false);
  const [decidingFailure, setDecidingFailure] = useState(false);
  const [retryingTimeout, setRetryingTimeout] = useState(false);

  const businessName = order.organizational
    ? businessDisplayName(order.organizational)
    : 'Negocio';

  // Soporte de pago: solo aplica a métodos distintos a efectivo. El cliente
  // dueño puede subirlo/cambiarlo mientras el pedido no esté cancelado; el
  // repartidor no lo necesita (el cobro es asunto cliente ↔ negocio).
  const paidInCash = order.paidType?.code === 'EFEC';
  const state = order.stateType?.code ?? '';
  // El pago (y su comprobante) se hacen DESPUÉS de que el negocio acepte, así
  // que el cliente solo sube/paga en ACEP/PREP/RUTA (§44).
  const paymentActionable = ['ACEP', 'PREP', 'RUTA'].includes(state);
  const canAttachProof =
    perspective === 'client' && !paidInCash && paymentActionable;
  const rejected = !!order.paymentProofRejectedReason && !order.paymentProofUrl;
  // El domiciliario ve el comprobante (solo lectura) para confirmar que sí se
  // pagó; el cliente lo sube/paga; el negocio lo verifica o rechaza.
  const showProofSection =
    !paidInCash &&
    (perspective === 'delivery'
      ? !!order.paymentProofUrl
      : !!order.paymentProofUrl || canAttachProof || rejected);

  // Datos del negocio para pagar (los ve el cliente al subir el comprobante).
  const org = order.organizational;
  const hasNequi = !!(org?.nequiNumber || org?.nequiKey);
  const hasBancolombia = !!(org?.bancolombiaAccount || org?.bancolombiaQrUrl);

  async function uploadProof(uri: string) {
    setUploadingProof(true);
    try {
      await ordersService.uploadPaymentProof(order.id, uri);
      onPaymentProofChanged?.();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setUploadingProof(false);
    }
  }

  // Chat cliente ↔ repartidor: existe desde que hay repartidor asignado
  // (queda de solo lectura al finalizar; la pantalla del chat lo maneja).
  const chatAvailable = perspective !== 'business' && !!order.deliveryUser;

  // Entrega fallida (Anexo I / Art. 31-32 TYC, NOTAS §59): solo el CLIENTE
  // decide, y solo si no se ha usado ya el único reintento permitido.
  const awaitingFailureDecision =
    perspective === 'client' && state === 'FALL' && order.retryCount < 1;

  async function retryDelivery() {
    setDecidingFailure(true);
    try {
      await ordersService.changeState(order.id, 'RUTA');
      onOrderChanged?.();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setDecidingFailure(false);
    }
  }

  async function cancelAfterFailure() {
    setDecidingFailure(true);
    try {
      await ordersService.changeState(order.id, 'CANC', {
        cancellationReason: 'El cliente decidió no reintentar la entrega.',
      });
      onOrderChanged?.();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setDecidingFailure(false);
    }
  }

  // "¿Deseas esperar 5 minutos más?" — cliente y repartidor lo ven (reunión
  // 2026-08-04): se muestra mientras el pedido sigue EN RUTA con el
  // repartidor "En sitio" — nunca pasa visiblemente por FALL.
  const showArrivalCountdown =
    (perspective === 'client' || perspective === 'delivery') &&
    state === 'RUTA' &&
    !!order.arrivedAt;

  async function retryAfterTimeout() {
    setRetryingTimeout(true);
    try {
      await ordersService.retryAfterTimeout(order.id);
      onOrderChanged?.();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setRetryingTimeout(false);
    }
  }

  return (
    <View className="p-5">
      {/* Progreso + estimado vigente */}
      <View className="mb-5 rounded-2xl bg-card p-4">
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
            caption="Díctaselo al domiciliario cuando recibas tu pedido."
          />
        )}

      {/* Cronómetro de espera "En sitio" + "¿esperar 5 min más?" (reunión
          2026-08-04) — cliente y repartidor lo ven, nunca pasa por FALL. */}
      {showArrivalCountdown && (
        <View className="mb-5">
          <ArrivalCountdown
            arrivedAt={order.arrivedAt!}
            retryCount={order.retryCount}
            retrying={retryingTimeout}
            onRetry={retryAfterTimeout}
          />
        </View>
      )}

      {/* Entrega fallida: el cliente decide reintentar (cargo del Anexo I) o
          cancelar. Si ya se usó el único reintento, solo queda cancelar —
          el motivo se muestra igual, sin botones. */}
      {state === 'FALL' && (
        <View className="mb-5 rounded-2xl bg-amber-50 p-3.5">
          <View className="flex-row gap-2">
            <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
            <Text className="flex-1 text-[13px] text-amber-700">
              No se pudo entregar tu pedido
              {order.deliveryFailReason ? `: ${order.deliveryFailReason}` : '.'}
            </Text>
          </View>
          {awaitingFailureDecision ? (
            <View className="mt-3 flex-row gap-2.5">
              <Pressable
                onPress={retryDelivery}
                disabled={decidingFailure}
                className={`h-11 flex-1 items-center justify-center rounded-xl bg-primary active:opacity-80 ${decidingFailure ? 'opacity-60' : ''}`}
              >
                {decidingFailure ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-[13px] font-bold text-white">
                    Reintentar (+$6.000)
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={cancelAfterFailure}
                disabled={decidingFailure}
                className={`h-11 flex-1 items-center justify-center rounded-xl border border-red-300 active:opacity-70 ${decidingFailure ? 'opacity-60' : ''}`}
              >
                <Text className="text-[13px] font-bold text-red-600">
                  Cancelar pedido
                </Text>
              </Pressable>
            </View>
          ) : perspective === 'client' ? (
            <Text className="mt-2 text-[12px] text-amber-700">
              Ya se usó el reintento disponible para este pedido.
            </Text>
          ) : null}
        </View>
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
          avatarUri={order.organizational?.logoUrl}
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
          caption="Domiciliario"
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
              ? 'Chatear con el domiciliario'
              : 'Chatear con el cliente'}
          </Text>
        </Pressable>
      )}

      {/* Dirección de entrega */}
      <Text className="mb-2 mt-1 text-sm font-bold text-ink">
        Dirección de entrega
      </Text>
      <View className="mb-5 flex-row gap-2.5 rounded-2xl bg-surface p-3.5">
        <Ionicons name="location" size={18} color={colors.primaryColor} />
        <View className="flex-1">
          <Text className="text-[14px] font-semibold text-ink">
            {order.deliveryAddress}
          </Text>
          {!!order.deliveryDetails && (
            <Text className="text-xs text-muted">{order.deliveryDetails}</Text>
          )}
        </View>
      </View>

      {/* Artículos */}
      <Text className="mb-2 text-sm font-bold text-ink">Artículos</Text>
      <View className="mb-5 rounded-2xl bg-surface p-3.5">
        {(order.details ?? []).map((detail, idx) => (
          <View
            key={detail.id}
            className={`flex-row items-center gap-2.5 ${idx > 0 ? 'mt-2.5' : ''}`}
          >
            {/* Foto del producto (si el negocio lo borró, queda el icono). */}
            <Avatar
              uri={detail.product?.images?.[0]}
              fallbackSource={DEFAULT_PRODUCT_IMAGE}
              icon="cube-outline"
              size={40}
              shape="rounded"
            />
            <Text className="text-[13px] font-extrabold text-primary">
              {detail.quantity}×
            </Text>
            <Text numberOfLines={1} className="flex-1 text-[13px] text-ink">
              {detail.productName}
              {detail.discount > 0 ? ` (-${detail.discount}%)` : ''}
            </Text>
            <Text className="text-[13px] font-semibold text-ink">
              {formatPrice(detail.lineTotal)}
            </Text>
          </View>
        ))}
      </View>

      {/* Pago + nota */}
      <View className="mb-5 rounded-2xl bg-surface p-3.5">
        <View className="flex-row items-center gap-2">
          <Ionicons name="cash-outline" size={16} color={colors.mutedColor} />
          <Text className="text-[13px] text-ink">
            Pago: {order.paidType?.name ?? '—'}
            {order.paidType?.code === 'EFEC' ? ' (contra-entrega)' : ''}
          </Text>
        </View>
        {!!order.notes && (
          <View className="mt-2 flex-row items-start gap-2">
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.mutedColor} />
            <Text className="flex-1 text-[13px] text-ink">{order.notes}</Text>
          </View>
        )}

        {/* Soporte de pago (transferencia/Nequi/Daviplata): el cliente lo
            sube, el negocio lo revisa. Toca la imagen para verla completa. */}
        {showProofSection && (
          <View className="mt-3 border-t border-border pt-3">
            <Text className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">
              Soporte de pago
            </Text>

            {/* Comprobante rechazado por el negocio: el cliente ve el motivo. */}
            {rejected && (
              <View className="mb-2.5 flex-row gap-2 rounded-xl bg-red-50 p-3">
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text className="flex-1 text-[13px] text-red-600">
                  {perspective === 'client'
                    ? `El negocio rechazó tu comprobante: ${order.paymentProofRejectedReason}. Vuelve a subirlo.`
                    : `Rechazaste el comprobante: ${order.paymentProofRejectedReason}`}
                </Text>
              </View>
            )}

            {/* Datos para pagar (cliente, cuando le toca subir el comprobante). */}
            {perspective === 'client' &&
              canAttachProof &&
              !order.paymentProofUrl &&
              (hasNequi || hasBancolombia) && (
                <View className="mb-2.5 rounded-xl bg-primary-tint p-3">
                  <View className="mb-1 flex-row items-center gap-2">
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={15}
                      color={colors.primaryColor}
                    />
                    <Text className="flex-1 text-[13px] font-extrabold text-ink">
                      Paga {formatPrice(order.total)}
                      {org?.paymentHolderName
                        ? ` a ${org.paymentHolderName}`
                        : ''}
                    </Text>
                  </View>
                  {order.paidType?.code === 'NEQUI' && !!org?.nequiNumber && (
                    <PayRow label="Número Nequi" value={org.nequiNumber} />
                  )}
                  {order.paidType?.code === 'NEQUI' && !!org?.nequiKey && (
                    <PayRow label="Llave Nequi" value={org.nequiKey} />
                  )}
                  {order.paidType?.code === 'TRAN' &&
                    !!org?.bancolombiaAccount && (
                      <PayRow
                        label="Cuenta Bancolombia"
                        value={
                          org.bancolombiaAccountType
                            ? `${org.bancolombiaAccount} (${org.bancolombiaAccountType === 'AHORROS' ? 'Ahorros' : 'Corriente'})`
                            : org.bancolombiaAccount
                        }
                      />
                    )}
                  {order.paidType?.code === 'TRAN' && !!org?.bancolombiaQrUrl && (
                    <View className="mt-2 items-center rounded-lg bg-card p-2.5">
                      <Image
                        source={{ uri: org.bancolombiaQrUrl }}
                        style={{ width: 180, height: 180 }}
                        resizeMode="contain"
                      />
                      <Text className="mt-1 text-[11px] text-muted">
                        Escanea el QR desde tu app Bancolombia
                      </Text>
                    </View>
                  )}
                </View>
              )}

            {order.paymentProofUrl ? (
              <Pressable
                onPress={() => setProofViewerOpen(true)}
                className="h-44 overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
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
                onPress={() => setProofMenuVisible(true)}
                disabled={uploadingProof}
                className={`mt-2.5 h-11 flex-row items-center justify-center gap-2 rounded-xl border border-primary active:opacity-70 ${
                  uploadingProof ? 'opacity-60' : ''
                }`}
              >
                {uploadingProof ? (
                  <ActivityIndicator size="small" color={colors.primaryColor} />
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={16} color={colors.primaryColor} />
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

      <PhotoActionsSheet
        visible={proofMenuVisible}
        label="Soporte de pago"
        onPickLibrary={() => pickPhoto('library', uploadProof)}
        onPickCamera={() => pickPhoto('camera', uploadProof)}
        onClose={() => setProofMenuVisible(false)}
      />

      {/* Totales */}
      <View className="rounded-2xl bg-card p-4">
        <TotalRow label="Subtotal" value={formatPrice(order.subtotal)} />
        <TotalRow label="Domicilio" value={formatPrice(order.deliveryFee)} />
        {order.deliverySurcharge > 0 && (
          <TotalRow label="Recargo" value={formatPrice(order.deliverySurcharge)} />
        )}
        <TotalRow label="Tarifa de servicio" value={formatPrice(order.serviceFee)} />
        <View className="my-2 h-px bg-border" />
        <TotalRow label="Total" value={formatPrice(order.total)} bold />
      </View>
    </View>
  );
}

/** Fila "etiqueta · valor" de los datos para pagar (número/llave/cuenta), con botón de copiar. */
function PayRow({ label, value }: { label: string; value: string }) {
  const colors = useResolvedAppColors();

  async function handleCopy() {
    await Clipboard.setStringAsync(value);
    toast.success('Copiado al portapapeles.');
  }

  return (
    <View className="mt-1 flex-row items-center justify-between gap-2">
      <Text className="text-[12px] text-muted">{label}</Text>
      <Pressable
        onPress={handleCopy}
        hitSlop={6}
        className="flex-row items-center gap-1.5 active:opacity-60"
      >
        <Text
          selectable
          className="text-[13px] font-extrabold tracking-wide text-ink"
        >
          {value}
        </Text>
        <Ionicons name="copy-outline" size={14} color={colors.primaryColor} />
      </Pressable>
    </View>
  );
}

function ContactRow({
  icon,
  avatarUri,
  label,
  detail,
  caption,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  /** Foto del negocio (logo) — si viene, reemplaza el ícono plano. */
  avatarUri?: string | null;
  label: string;
  detail?: string | null;
  caption?: string;
}) {
  const colors = useResolvedAppColors();
  const [preview, setPreview] = useState(false);
  return (
    <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      {avatarUri !== undefined ? (
        <>
          <Pressable
            onPress={() => avatarUri && setPreview(true)}
            disabled={!avatarUri}
          >
            <Avatar
              uri={avatarUri}
              fallbackSource={DEFAULT_BUSINESS_LOGO}
              icon={icon}
              size={40}
              shape="rounded"
            />
          </Pressable>
          <PhotoPreviewModal
            uri={preview ? avatarUri ?? null : null}
            onClose={() => setPreview(false)}
          />
        </>
      ) : (
        <View className="h-10 w-10 items-center justify-center">
          <Ionicons name={icon} size={22} color={colors.primaryColor} />
        </View>
      )}
      <View className="flex-1">
        {!!caption && (
          <Text className="text-[10px] font-bold uppercase tracking-wide text-muted">
            {caption}
          </Text>
        )}
        <Text numberOfLines={1} className="text-[14px] font-bold text-ink">
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
          bold ? 'text-base font-extrabold text-ink' : 'text-sm text-muted'
        }
      >
        {label}
      </Text>
      <Text
        className={
          bold
            ? 'text-base font-extrabold text-primary'
            : 'text-sm font-semibold text-ink'
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
      <Text className="mt-1 text-3xl font-extrabold tracking-[8px] text-primary">
        {code}
      </Text>
      <Text className="mt-1 text-center text-xs text-muted">{caption}</Text>
    </View>
  );
}
