import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressSheet } from '@/components/client/address-sheet';
import { Avatar } from '@/components/ui/avatar';
import { DocumentPhotoField } from '@/components/ui/document-photo-field';
import { Select } from '@/components/ui/select';
import { useCart } from '@/context/cart';
import { useUserAddresses } from '@/hooks/use-user-data';
import { finalPrice, formatPrice } from '@/lib/price';
import { toast } from '@/lib/toast';
import { ExploreBusiness, exploreService } from '@/services/explore';
import { ordersService } from '@/services/orders';

/**
 * Checkout del cliente: revisa el carrito, elige a dónde enviar (dirección
 * principal, editable desde la hoja) y el método de pago, agrega una nota y
 * confirma. El total = subtotal (del carrito) + domicilio (tarifa del backend).
 */
export default function CheckoutScreen() {
  const router = useRouter();
  const cart = useCart();

  // Caché compartida: la dirección llega al instante.
  const { defaultAddress, loading: loadingAddr } = useUserAddresses();
  const [sheetVisible, setSheetVisible] = useState(false);

  // Domicilio EN VIVO por distancia (negocio ↔ dirección elegida) — no es un
  // dato global cacheable como antes, cambia con cada negocio/dirección.
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loadingFee, setLoadingFee] = useState(false);
  useEffect(() => {
    if (!cart.businessId) return;
    setLoadingFee(true);
    ordersService
      .deliveryFee({
        organizationalId: cart.businessId,
        latitude: defaultAddress?.latitude ?? undefined,
        longitude: defaultAddress?.longitude ?? undefined,
      })
      .then((res) => setDeliveryFee(res.data.deliveryFee))
      .catch(() => {
        // El interceptor ya mostró el error; el total sigue sin domicilio.
      })
      .finally(() => setLoadingFee(false));
  }, [cart.businessId, defaultAddress?.latitude, defaultAddress?.longitude]);

  const [payment, setPayment] = useState<string>('EFEC');
  const [notes, setNotes] = useState('');
  // Soporte del pago (pantallazo de la transferencia): OBLIGATORIO cuando el
  // método no es efectivo (así el negocio verifica que el pago sí llegó).
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [proofError, setProofError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Datos de pago del negocio (a dónde transferir). Definen qué métodos se
  // ofrecen: sin datos diligenciados solo queda efectivo.
  const [bizPay, setBizPay] = useState<ExploreBusiness | null>(null);
  useEffect(() => {
    if (!cart.businessId) return;
    exploreService
      .business(cart.businessId)
      .then((res) => setBizPay(res.data.organizational))
      .catch(() => {
        // Sin datos el checkout solo ofrece efectivo (el toast ya salió).
      });
  }, [cart.businessId]);

  const hasNequi = !!(bizPay?.nequiNumber || bizPay?.nequiKey);
  const hasBancolombia = !!(
    bizPay?.bancolombiaAccount || bizPay?.bancolombiaQrUrl
  );
  const paymentOptions = useMemo(
    () => [
      { value: 'EFEC', label: 'Efectivo' },
      ...(hasNequi ? [{ value: 'NEQUI', label: 'Nequi' }] : []),
      ...(hasBancolombia
        ? [{ value: 'TRAN', label: 'Transferencia Bancolombia' }]
        : []),
    ],
    [hasNequi, hasBancolombia],
  );

  // Si el método elegido dejó de ofrecerse (recarga de datos), vuelve a efectivo.
  useEffect(() => {
    if (!paymentOptions.some((option) => option.value === payment)) {
      setPayment('EFEC');
    }
  }, [paymentOptions, payment]);

  const total = cart.subtotal + deliveryFee;

  // Carrito vacío (p. ej. tras confirmar): no hay nada que pagar.
  if (cart.count === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <StatusBar style="dark" />
        <Ionicons name="cart-outline" size={48} color="#C9C9D4" />
        <Text className="mt-3 text-center text-sm text-muted">
          Tu carrito está vacío.
        </Text>
        <Pressable onPress={() => router.replace('/home')} className="mt-5">
          <Text className="text-[15px] font-bold text-primary">
            Ir al inicio
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  async function confirm() {
    if (!defaultAddress) {
      toast.error('Agrega una dirección de entrega para continuar.');
      setSheetVisible(true);
      return;
    }
    // El comprobante es OPCIONAL al crear el pedido: el cliente puede subirlo
    // ahora o después, pero el negocio no podrá pasar el pedido a preparación
    // (métodos distintos a efectivo) hasta que el comprobante esté cargado.
    setSubmitting(true);
    try {
      const res = await ordersService.create({
        organizationalId: cart.businessId!,
        addressId: defaultAddress.id,
        paidTypeCode: payment,
        items: cart.items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        notes: notes.trim() || undefined,
      });
      const orderId = res.data.rowId;
      // El soporte se sube DESPUÉS de crear (necesita el id). Si falla, el
      // pedido igual queda creado y el soporte se puede subir del detalle.
      if (payment !== 'EFEC' && proofUri) {
        try {
          await ordersService.uploadPaymentProof(Number(orderId), proofUri);
        } catch {
          // El interceptor HTTP ya mostró el error.
        }
      }
      cart.clear();
      router.replace({ pathname: '/orders/[id]', params: { id: orderId } });
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Cabecera */}
      <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#1E1E2D" />
        </Pressable>
        <Text className="text-lg font-extrabold text-dark">
          Confirmar pedido
        </Text>
      </View>

      {/* Scroll consciente del teclado: sube la nota al escribirla. */}
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        {/* Negocio */}
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="storefront-outline" size={16} color="#7A7A8A" />
          <Text className="text-sm font-bold text-dark">
            {cart.businessName}
          </Text>
        </View>

        {/* Dirección de entrega */}
        <Text className="mb-2 text-sm font-bold text-gray-700">Enviar a</Text>
        {loadingAddr ? (
          <ActivityIndicator
            color="#FF5A3C"
            style={{ alignSelf: 'flex-start' }}
          />
        ) : (
          <Pressable
            onPress={() => setSheetVisible(true)}
            className="mb-5 flex-row items-center gap-3 rounded-2xl border border-gray-200 p-3.5 active:opacity-70"
          >
            <Ionicons name="location" size={20} color="#FF5A3C" />
            <View className="flex-1">
              {defaultAddress ? (
                <>
                  <Text className="text-[15px] font-bold text-dark">
                    {defaultAddress.label}
                  </Text>
                  <Text numberOfLines={1} className="text-xs text-muted">
                    {defaultAddress.address}
                    {defaultAddress.details
                      ? ` · ${defaultAddress.details}`
                      : ''}
                  </Text>
                </>
              ) : (
                <Text className="text-[15px] font-bold text-primary">
                  Agregar dirección de entrega
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9C9D4" />
          </Pressable>
        )}

        {/* Productos: editables mientras el pedido no se haya enviado al
            negocio (aún en el carrito) — sumar, restar o quitar cada uno. */}
        <Text className="mb-2 text-sm font-bold text-gray-700">Tu pedido</Text>
        <View className="mb-5 rounded-2xl bg-surface p-3.5">
          {cart.items.map((item, idx) => {
            const price = finalPrice(
              item.product.priceSale,
              item.product.discount,
            );
            return (
              <View
                key={item.product.id}
                className={`flex-row items-center gap-2.5 ${idx > 0 ? 'mt-3' : ''}`}
              >
                <Avatar
                  uri={item.product.images?.[0]}
                  icon="cube-outline"
                  size={40}
                  shape="rounded"
                />
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[13px] text-dark">
                    {item.product.name}
                  </Text>
                  <Text className="text-[12px] font-semibold text-dark">
                    {formatPrice(price * item.quantity)}
                  </Text>
                </View>

                {/* Stepper: restar (quita al llegar a 0) / cantidad / sumar */}
                <View className="flex-row items-center gap-2 rounded-full bg-white px-1.5 py-1">
                  <Pressable
                    onPress={() => cart.decrement(item.product.id)}
                    hitSlop={6}
                    className="h-7 w-7 items-center justify-center rounded-full bg-surface active:opacity-70"
                  >
                    <Ionicons name="remove" size={16} color="#1E1E2D" />
                  </Pressable>
                  <Text className="min-w-[18px] text-center text-[14px] font-extrabold text-dark">
                    {item.quantity}
                  </Text>
                  <Pressable
                    onPress={() =>
                      cart.add(item.product, {
                        id: cart.businessId!,
                        name: cart.businessName ?? '',
                      })
                    }
                    hitSlop={6}
                    className="h-7 w-7 items-center justify-center rounded-full bg-primary active:opacity-70"
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>

                {/* Quitar el producto por completo */}
                <Pressable
                  onPress={() => cart.remove(item.product.id)}
                  hitSlop={6}
                  className="ml-0.5 active:opacity-70"
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Método de pago: solo los que el negocio tiene diligenciados */}
        <Select
          label="Método de pago"
          icon="cash-outline"
          options={paymentOptions}
          value={payment}
          onSelect={setPayment}
        />

        {/* Datos para transferir + comprobante (obligatorio si no es efectivo) */}
        {payment !== 'EFEC' && bizPay && (
          <View className="-mt-1">
            <View className="mb-4 rounded-2xl bg-primary-tint p-4">
              <View className="mb-2 flex-row items-center gap-2">
                <Ionicons name="swap-horizontal-outline" size={16} color="#FF5A3C" />
                <Text className="flex-1 text-sm font-extrabold text-dark">
                  Transfiere {formatPrice(total)}
                  {bizPay.paymentHolderName
                    ? ` a ${bizPay.paymentHolderName}`
                    : ''}
                </Text>
              </View>

              {payment === 'NEQUI' && !!bizPay.nequiNumber && (
                <PayRow label="Número Nequi" value={bizPay.nequiNumber} />
              )}
              {payment === 'NEQUI' && !!bizPay.nequiKey && (
                <PayRow label="Llave Nequi" value={bizPay.nequiKey} />
              )}
              {payment === 'TRAN' && !!bizPay.bancolombiaAccount && (
                <PayRow
                  label="Cuenta Bancolombia"
                  value={bizPay.bancolombiaAccount}
                />
              )}
              {payment === 'TRAN' && !!bizPay.bancolombiaQrUrl && (
                <View className="mt-2 items-center rounded-xl bg-white p-3">
                  <Image
                    source={{ uri: bizPay.bancolombiaQrUrl }}
                    style={{ width: 220, height: 220 }}
                    resizeMode="contain"
                  />
                  <Text className="mt-1 text-xs text-muted">
                    Escanea el QR desde tu app Bancolombia
                  </Text>
                </View>
              )}
            </View>

            <DocumentPhotoField
              label="Comprobante del pago (opcional)"
              uri={proofUri}
              onChange={(uri) => {
                setProofUri(uri);
                setProofError('');
              }}
              error={proofError}
              placeholderIcon="receipt-outline"
            />
            <Text className="-mt-2 mb-4 text-xs text-muted">
              Puedes subir el pantallazo ahora o desde el detalle del pedido. El
              negocio necesita verlo para poder preparar tu pedido.
            </Text>
          </View>
        )}

        {/* Nota */}
        <Text className="mb-2 text-sm font-bold text-gray-700">
          Nota para el negocio (opcional)
        </Text>
        <View className="mb-5 rounded-xl border border-gray-200 px-3.5 py-2.5">
          <TextInput
            className="min-h-[44px] text-[15px] text-dark"
            placeholder="Ej: sin cebolla, timbre dañado — llamar."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
          />
        </View>

        {/* Totales */}
        <View className="rounded-2xl bg-surface p-4">
          <Row label="Subtotal" value={formatPrice(cart.subtotal)} />
          <Row
            label="Domicilio"
            value={loadingFee ? 'Calculando…' : formatPrice(deliveryFee)}
          />
          <View className="my-2 h-px bg-gray-200" />
          <Row label="Total" value={formatPrice(total)} bold />
        </View>
      </KeyboardAwareScrollView>

      {/* Confirmar */}
      <View className="border-t border-gray-100 px-5 pb-6 pt-3">
        <Pressable
          onPress={confirm}
          disabled={submitting || loadingFee}
          className={`h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80 ${
            submitting || loadingFee ? 'opacity-60' : ''
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text className="text-base font-extrabold text-white">
                Confirmar pedido
              </Text>
              <Text className="text-base font-extrabold text-white">
                · {formatPrice(total)}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <AddressSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

/** Dato de pago del negocio (número/llave/cuenta) en la tarjeta naranja. */
function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-1 flex-row items-center justify-between">
      <Text className="text-[13px] text-muted">{label}</Text>
      <Text
        selectable
        className="text-[14px] font-extrabold tracking-wide text-dark"
      >
        {value}
      </Text>
    </View>
  );
}

function Row({
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
