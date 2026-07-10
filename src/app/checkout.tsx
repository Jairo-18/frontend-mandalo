import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressSheet } from '@/components/client/address-sheet';
import { Select } from '@/components/ui/select';
import { useCart } from '@/context/cart';
import { useDeliveryFee, useUserAddresses } from '@/hooks/use-user-data';
import { finalPrice, formatPrice } from '@/lib/price';
import { toast } from '@/lib/toast';
import { ordersService } from '@/services/orders';

/** Métodos de pago contra-entrega (coinciden con la tabla paidType). */
const PAYMENT_METHODS = [
  { value: 'EFEC', label: 'Efectivo' },
  { value: 'TRAN', label: 'Transferencia' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVI', label: 'Daviplata' },
];

/**
 * Checkout del cliente: revisa el carrito, elige a dónde enviar (dirección
 * principal, editable desde la hoja) y el método de pago, agrega una nota y
 * confirma. El total = subtotal (del carrito) + domicilio (tarifa del backend).
 */
export default function CheckoutScreen() {
  const router = useRouter();
  const cart = useCart();

  // Caché compartida: la dirección y la tarifa llegan al instante.
  const { defaultAddress, loading: loadingAddr } = useUserAddresses();
  const deliveryFee = useDeliveryFee();
  const [sheetVisible, setSheetVisible] = useState(false);

  const [payment, setPayment] = useState<string>('EFEC');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
          <Text className="text-[15px] font-bold text-primary">Ir al inicio</Text>
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
        <Text className="text-lg font-extrabold text-dark">Confirmar pedido</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Negocio */}
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="storefront-outline" size={16} color="#7A7A8A" />
          <Text className="text-sm font-bold text-dark">{cart.businessName}</Text>
        </View>

        {/* Dirección de entrega */}
        <Text className="mb-2 text-sm font-bold text-gray-700">Enviar a</Text>
        {loadingAddr ? (
          <ActivityIndicator color="#FF5A3C" style={{ alignSelf: 'flex-start' }} />
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
                    {defaultAddress.details ? ` · ${defaultAddress.details}` : ''}
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

        {/* Productos */}
        <Text className="mb-2 text-sm font-bold text-gray-700">Tu pedido</Text>
        <View className="mb-5 rounded-2xl bg-surface p-3.5">
          {cart.items.map((item, idx) => {
            const price = finalPrice(item.product.priceSale, item.product.discount);
            return (
              <View
                key={item.product.id}
                className={`flex-row items-center gap-2 ${idx > 0 ? 'mt-2.5' : ''}`}
              >
                <Text className="text-[13px] font-extrabold text-primary">
                  {item.quantity}×
                </Text>
                <Text numberOfLines={1} className="flex-1 text-[13px] text-dark">
                  {item.product.name}
                </Text>
                <Text className="text-[13px] font-semibold text-dark">
                  {formatPrice(price * item.quantity)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Método de pago */}
        <Select
          label="Método de pago"
          icon="cash-outline"
          options={PAYMENT_METHODS}
          value={payment}
          onSelect={setPayment}
        />

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
          <Row label="Domicilio" value={formatPrice(deliveryFee)} />
          <View className="my-2 h-px bg-gray-200" />
          <Row label="Total" value={formatPrice(total)} bold />
        </View>
      </ScrollView>

      {/* Confirmar */}
      <View className="border-t border-gray-100 px-5 pb-6 pt-3">
        <Pressable
          onPress={confirm}
          disabled={submitting}
          className={`h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80 ${
            submitting ? 'opacity-60' : ''
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
