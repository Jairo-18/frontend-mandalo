import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressSheet } from '@/components/client/address-sheet';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAppTheme } from '@/context/app-theme';
import { useCart } from '@/context/cart';
import { useSession } from '@/hooks/use-session';
import { useUserAddresses } from '@/hooks/use-user-data';
import { finalPrice, formatPrice } from '@/lib/price';
import { toast } from '@/lib/toast';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/default-images';
import { ExploreBusiness, exploreService } from '@/services/explore';
import { ordersService } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Checkout del cliente: revisa el carrito, elige a dónde enviar (dirección
 * principal, editable desde la hoja) y el método de pago, agrega una nota y
 * confirma. El total = subtotal (del carrito) + domicilio + servicio (las
 * dos últimas las calcula el backend en vivo, ver `ordersService.deliveryFee`).
 */
export default function CheckoutScreen() {
  const colors = useResolvedAppColors();
  const router = useRouter();
  const { isDark } = useAppTheme();
  const cart = useCart();
  // Invitado (§44): armó el carrito sin cuenta; aquí se le pide crearla
  // (rápida, sin verificación de correo) para poder pedir de una.
  const isGuest = !useSession();

  // Caché compartida: la dirección llega al instante.
  const { defaultAddress, loading: loadingAddr } = useUserAddresses();
  const [sheetVisible, setSheetVisible] = useState(false);

  // Domicilio EN VIVO por distancia (negocio ↔ dirección elegida) — no es un
  // dato global cacheable como antes, cambia con cada negocio/dirección. La
  // tarifa de servicio viaja en la misma respuesta (depende del subtotal).
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliverySurcharge, setDeliverySurcharge] = useState(0);
  const [surchargeReasons, setSurchargeReasons] = useState<string[]>([]);
  const [serviceFee, setServiceFee] = useState(0);
  const [loadingFee, setLoadingFee] = useState(false);
  useEffect(() => {
    if (!cart.businessId) return;
    setLoadingFee(true);
    ordersService
      .deliveryFee({
        organizationalId: cart.businessId,
        latitude: defaultAddress?.latitude ?? undefined,
        longitude: defaultAddress?.longitude ?? undefined,
        subtotal: cart.subtotal,
      })
      .then((res) => {
        setDeliveryFee(res.data.deliveryFee);
        setDeliverySurcharge(res.data.deliverySurcharge);
        setSurchargeReasons(res.data.surchargeReasons);
        setServiceFee(res.data.serviceFee);
      })
      .catch(() => {
        // El interceptor ya mostró el error; el total sigue sin domicilio/servicio.
      })
      .finally(() => setLoadingFee(false));
  }, [
    cart.businessId,
    cart.subtotal,
    defaultAddress?.latitude,
    defaultAddress?.longitude,
  ]);

  const [payment, setPayment] = useState<string>('EFEC');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Datos de pago del negocio (a dónde transferir). Definen qué métodos se
  // ofrecen: sin datos diligenciados solo queda efectivo. `store/[id].tsx` ya
  // los trajo al agregar el primer producto (`cart.businessDetail`) — se
  // reusan en vez de volver a pedir `exploreService.business()` (auditoría de
  // peticiones). Fallback defensivo por si el carrito no lo tuviera.
  const [fallbackBizPay, setFallbackBizPay] = useState<ExploreBusiness | null>(
    null,
  );
  useEffect(() => {
    if (!cart.businessId || cart.businessDetail) return;
    exploreService
      .business(cart.businessId)
      .then((res) => setFallbackBizPay(res.data.organizational))
      .catch(() => {
        // Sin datos el checkout solo ofrece efectivo (el toast ya salió).
      });
  }, [cart.businessId, cart.businessDetail]);
  const bizPay = cart.businessDetail ?? fallbackBizPay;

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

  const total = cart.subtotal + deliveryFee + deliverySurcharge + serviceFee;

  // Carrito vacío (p. ej. tras confirmar): no hay nada que pagar.
  if (cart.count === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-card px-8">
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Ionicons name="cart-outline" size={48} color={colors.mutedColor} />
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

  // Invitado con carrito: crear cuenta rápida antes de pedir. El carrito vive
  // en memoria y sobrevive a la navegación, así que vuelve intacto.
  if (isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-card">
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
          >
            <Ionicons name="arrow-back" size={20} color={colors.inkColor} />
          </Pressable>
          <Text className="flex-1 text-lg font-extrabold text-ink">Casi listo</Text>
          <ThemeToggle />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-16 w-16 items-center justify-center">
            <Ionicons name="cart-outline" size={36} color={colors.primaryColor} />
          </View>
          <Text className="text-center text-[20px] font-extrabold text-ink">
            Crea tu cuenta para pedir
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">
            Tienes {cart.count} {cart.count === 1 ? 'producto' : 'productos'} por{' '}
            {formatPrice(cart.subtotal)}. Es rápido: creas tu cuenta y completas
            tu pedido de una — tu carrito se mantiene.
          </Text>

          <View className="mt-7 w-full">
            <Pressable
              onPress={() => router.push('/auth/quick-register')}
              className="h-[54px] items-center justify-center overflow-hidden rounded-2xl active:opacity-80"
            >
              <LinearGradient
                colors={[colors.primaryColor, colors.darkColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', inset: 0 }}
              />
              <Text className="text-base font-extrabold text-white">
                Crear cuenta y continuar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/auth/login')}
              className="mt-3 items-center py-2 active:opacity-70"
            >
              <Text className="text-[14px] font-bold text-primary">
                Ya tengo cuenta · Iniciar sesión
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  async function confirm() {
    if (!defaultAddress) {
      toast.error('Agrega una dirección de entrega para continuar.');
      setSheetVisible(true);
      return;
    }
    // El pedido se manda al negocio SIN comprobante: primero decide si lo
    // acepta y, si el pago no es efectivo, luego te pide el comprobante desde
    // el detalle del pedido (ahí ves los datos para pagar). Ver §44.
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
      cart.clear();
      router.replace({ pathname: '/orders/[id]', params: { id: orderId } });
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-card">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Cabecera */}
      <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color={colors.inkColor} />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-ink">
          Confirmar pedido
        </Text>
        <ThemeToggle />
      </View>

      {/* Scroll consciente del teclado: sube la nota al escribirla. */}
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        {/* Negocio */}
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="storefront-outline" size={16} color={colors.mutedColor} />
          <Text className="text-sm font-bold text-ink">
            {cart.businessName}
          </Text>
        </View>

        {/* Dirección de entrega */}
        <Text className="mb-2 text-sm font-bold text-ink">Enviar a</Text>
        {loadingAddr ? (
          <ActivityIndicator
            color={colors.primaryColor}
            style={{ alignSelf: 'flex-start' }}
          />
        ) : (
          <Pressable
            onPress={() => setSheetVisible(true)}
            className="mb-5 flex-row items-center gap-3 rounded-2xl border border-border p-3.5 active:opacity-70"
          >
            <Ionicons name="location" size={20} color={colors.primaryColor} />
            <View className="flex-1">
              {defaultAddress ? (
                <>
                  <Text className="text-[15px] font-bold text-ink">
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
            <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
          </Pressable>
        )}

        {/* Productos: editables mientras el pedido no se haya enviado al
            negocio (aún en el carrito) — sumar, restar o quitar cada uno. */}
        <Text className="mb-2 text-sm font-bold text-ink">Tu pedido</Text>
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
                  fallbackSource={DEFAULT_PRODUCT_IMAGE}
                  icon="cube-outline"
                  size={40}
                  shape="rounded"
                />
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[13px] text-ink">
                    {item.product.name}
                  </Text>
                  <Text className="text-[12px] font-semibold text-ink">
                    {formatPrice(price * item.quantity)}
                  </Text>
                </View>

                {/* Stepper: restar (quita al llegar a 0) / cantidad / sumar */}
                <View className="flex-row items-center gap-2 rounded-full bg-card px-1.5 py-1">
                  <Pressable
                    onPress={() => cart.decrement(item.product.id)}
                    hitSlop={6}
                    className="h-7 w-7 items-center justify-center rounded-full bg-surface active:opacity-70"
                  >
                    <Ionicons name="remove" size={16} color={colors.inkColor} />
                  </Pressable>
                  <Text className="min-w-[18px] text-center text-[14px] font-extrabold text-ink">
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

        {/* Métodos distintos a efectivo: el pago (y el comprobante) se hacen
            DESPUÉS de que el negocio acepte el pedido, desde su detalle. */}
        {payment !== 'EFEC' && (
          <View className="-mt-1 mb-4 flex-row gap-2.5 rounded-2xl bg-primary-tint px-4 py-3">
            <Ionicons name="information-circle-outline" size={18} color={colors.primaryColor} />
            <Text className="flex-1 text-[13px] text-primary">
              Primero mandamos tu pedido al negocio. Cuando lo acepte, te
              pediremos el comprobante y verás los datos para pagar desde el
              detalle del pedido.
            </Text>
          </View>
        )}

        {/* Nota */}
        <Text className="mb-2 text-sm font-bold text-ink">
          Nota para el negocio (opcional)
        </Text>
        <View className="mb-5 rounded-xl border border-border px-3.5 py-2.5">
          <TextInput
            className="min-h-[44px] text-[15px] text-ink"
            placeholder="Ej: sin cebolla, timbre dañado — llamar."
            placeholderTextColor={colors.mutedColor}
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
          {!loadingFee && deliverySurcharge > 0 && (
            <Row
              label={`Recargo${surchargeReasons.length ? ` (${surchargeReasons.join(', ')})` : ''}`}
              value={formatPrice(deliverySurcharge)}
            />
          )}
          <Row
            label="Tarifa de servicio"
            value={loadingFee ? 'Calculando…' : formatPrice(serviceFee)}
          />
          <View className="my-2 h-px bg-border" />
          <Row label="Total" value={formatPrice(total)} bold />
        </View>
      </KeyboardAwareScrollView>

      {/* Confirmar */}
      <View className="border-t border-border px-5 pb-6 pt-3">
        <Pressable
          onPress={confirm}
          disabled={submitting || loadingFee}
          className={`h-[54px] flex-row items-center justify-center gap-2 overflow-hidden rounded-2xl active:opacity-80 ${
            submitting || loadingFee ? 'opacity-60' : ''
          }`}
        >
          <LinearGradient
            colors={[colors.primaryColor, colors.darkColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', inset: 0 }}
          />
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
