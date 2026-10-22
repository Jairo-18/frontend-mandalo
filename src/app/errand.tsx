import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressMapPicker } from '@/components/client/address-map-picker';
import { AddressPickerResult } from '@/components/client/address-map-picker-fallback';
import { AddressSheet } from '@/components/client/address-sheet';
import { AmountRow } from '@/components/ui/amount-row';
import { FilterChips } from '@/components/ui/filter-chips';
import { TextField } from '@/components/ui/text-field';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAppTheme } from '@/context/app-theme';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useSession } from '@/hooks/use-session';
import { useUserAddresses } from '@/hooks/use-user-data';
import { markClientOrdersStale } from '@/lib/orders-stale';
import { formatPrice } from '@/lib/price';
import { copToNumber, formatText } from '@/lib/text-format';
import { toast } from '@/lib/toast';
import { ERRAND_MAX_PURCHASE, ordersService } from '@/services/orders';

type Payment = 'EFEC' | 'NEQUI';

/**
 * "Pedir un mandado": el cliente le pide a un domiciliario que haga algo por
 * él (comprar, recoger, llevar un documento) sin negocio de por medio. Elige
 * dónde recoger (opcional, en el mapa) y dónde entregar, describe la tarea,
 * dice cuánto cuesta la compra (si hay; la adelanta el domiciliario) y
 * ofrece cuánto paga — mínimo la tarifa por distancia de la app. Se le paga
 * directo al domiciliario, en efectivo o por Nequi.
 */
export default function ErrandScreen() {
  const router = useRouter();
  const colors = useResolvedAppColors();
  const { isDark } = useAppTheme();
  const isGuest = !useSession()?.user;
  const { defaultAddress, loading: loadingAddr } = useUserAddresses();
  const { errors, clearError, bind, validate, applyServerErrors } = useFormErrors();

  const [pickup, setPickup] = useState<AddressPickerResult | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [purchase, setPurchase] = useState('');
  const [offered, setOffered] = useState('');
  const [payment, setPayment] = useState<Payment>('EFEC');
  const [submitting, setSubmitting] = useState(false);
  // Uno por intento: si se reintenta tras un corte, el backend no duplica.
  const [idempotencyKey] = useState(() => Crypto.randomUUID());

  // Mínimo que se puede ofrecer: la tarifa por distancia de la app.
  // `key`: para qué entrega/recogida se calculó (si no coincide, está cargando).
  const [quote, setQuote] = useState<{
    key: string;
    fee: number;
    reasons: string[];
  } | null>(null);
  const addressId = defaultAddress?.id;
  const pickupLat = pickup?.coords.latitude;
  const pickupLng = pickup?.coords.longitude;
  const quoteKey = `${addressId}|${pickupLat}|${pickupLng}`;
  const loadingMin = !!addressId && quote?.key !== quoteKey;
  const minimum = quote && quote.key === quoteKey && quote.fee > 0 ? quote : null;
  useEffect(() => {
    if (!addressId) return;
    let alive = true;
    const key = `${addressId}|${pickupLat}|${pickupLng}`;
    ordersService
      .errandFee({ addressId, pickupLatitude: pickupLat, pickupLongitude: pickupLng })
      .then((res) => {
        if (!alive) return;
        setQuote({ key, fee: res.data.minimumFee, reasons: res.data.surchargeReasons });
        // La primera vez (o si ofrecía menos que el nuevo mínimo) se sugiere el mínimo.
        setOffered((prev) =>
          !prev || copToNumber(prev) < res.data.minimumFee
            ? formatText('cop', String(Math.round(res.data.minimumFee)))
            : prev,
        );
      })
      .catch(() => {
        // Sin cotización: el backend igual valida el mínimo al publicar.
        if (alive) setQuote({ key, fee: 0, reasons: [] });
      });
    return () => {
      alive = false;
    };
  }, [addressId, pickupLat, pickupLng]);

  const offeredValue = copToNumber(offered) || 0;
  const purchaseValue = copToNumber(purchase) || 0;
  const total = offeredValue + purchaseValue;

  function handlePickup(result: AddressPickerResult) {
    setMapVisible(false);
    setPickup(result);
    // Prellena la referencia con lo que resolvió el mapa (editable).
    if (!pickupAddress.trim() && result.address) setPickupAddress(result.address);
  }

  async function submit() {
    if (!defaultAddress) {
      toast.error('Agrega la dirección donde entregamos el mandado.');
      setSheetVisible(true);
      return;
    }
    const ok = validate({
      description:
        description.trim().length >= 5
          ? undefined
          : 'Cuéntale al domiciliario qué debe hacer (mínimo 5 caracteres).',
      purchaseAmount:
        purchaseValue > ERRAND_MAX_PURCHASE
          ? `La compra no puede pasar de ${formatPrice(ERRAND_MAX_PURCHASE)}.`
          : undefined,
      offeredFee: !offeredValue
        ? 'Ingresa cuánto ofreces por el mandado.'
        : minimum && offeredValue < minimum.fee
          ? `Lo mínimo para este mandado es ${formatPrice(minimum.fee)}.`
          : undefined,
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      const res = await ordersService.createErrand({
        addressId: defaultAddress.id,
        ...(pickup && {
          pickupLatitude: pickup.coords.latitude,
          pickupLongitude: pickup.coords.longitude,
        }),
        pickupAddress: pickupAddress.trim() || undefined,
        description: description.trim(),
        notes: notes.trim() || undefined,
        purchaseAmount: purchaseValue || undefined,
        offeredFee: offeredValue,
        paidTypeCode: payment,
        idempotencyKey,
      });
      markClientOrdersStale();
      router.replace(
        { pathname: '/orders/[id]', params: { id: res.data.rowId } },
        { withAnchor: true },
      );
    } catch (e) {
      applyServerErrors(e);
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
        <Text className="flex-1 text-lg font-extrabold text-ink">Pedir un mandado</Text>
        <ThemeToggle />
      </View>

      {isGuest ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="walk-outline" size={40} color={colors.primaryColor} />
          <Text className="mt-3 text-center text-[18px] font-extrabold text-ink">
            Inicia sesión para pedir un mandado
          </Text>
          <Pressable
            onPress={() => router.push('/auth/login')}
            className="mt-5 h-12 items-center justify-center rounded-2xl bg-primary px-6 active:opacity-80"
          >
            <Text className="text-[15px] font-bold text-white">Iniciar sesión</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <KeyboardAwareScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
            bottomOffset={24}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="mb-5 text-[14px] leading-5 text-muted">
              Pídele a un domiciliario que haga un mandado por ti: comprar algo, recoger
              o llevar un documento. Tú ofreces el precio y le pagas directo a él.
            </Text>

            {/* Recogida (opcional) */}
            <Text className="mb-2 text-sm font-bold text-ink">
              ¿Dónde lo recogemos? (opcional)
            </Text>
            <View className="mb-3 rounded-2xl border border-border bg-surface p-3.5">
              <View className="flex-row gap-2.5">
                <Ionicons name="flag" size={18} color={colors.primaryColor} />
                <Text className="flex-1 text-[13px] text-ink">
                  {pickup
                    ? pickup.address || 'Punto marcado en el mapa'
                    : 'Déjalo así si no hay un punto específico (por ejemplo, "en cualquier droguería").'}
                </Text>
              </View>
              <View className="mt-2.5 flex-row gap-4">
                <Pressable
                  onPress={() => setMapVisible(true)}
                  hitSlop={6}
                  className="flex-row items-center gap-1.5 active:opacity-60"
                >
                  <Ionicons name="map-outline" size={15} color={colors.primaryColor} />
                  <Text className="text-[13px] font-bold text-primary">
                    {pickup ? 'Cambiar punto' : 'Seleccionar en el mapa'}
                  </Text>
                </Pressable>
                {!!pickup && (
                  <Pressable
                    onPress={() => setPickup(null)}
                    hitSlop={6}
                    className="flex-row items-center gap-1.5 active:opacity-60"
                  >
                    <Ionicons name="close-circle-outline" size={15} color="#DC2626" />
                    <Text className="text-[13px] font-bold text-red-600">Quitar</Text>
                  </Pressable>
                )}
              </View>
            </View>
            <TextField
              label="Nombre o referencia del lugar (opcional)"
              icon="storefront-outline"
              format="sentence"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Ej: Droguería La Colonial"
              maxLength={255}
            />

            {/* Entrega */}
            <Text className="mb-2 text-sm font-bold text-ink">¿Dónde lo entregamos?</Text>
            {loadingAddr ? (
              <ActivityIndicator color={colors.primaryColor} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Pressable
                onPress={() => setSheetVisible(true)}
                className="mb-5 flex-row items-center gap-3 rounded-2xl border border-border p-3.5 active:opacity-70"
              >
                <Ionicons name="location" size={20} color={colors.primaryColor} />
                <View className="flex-1">
                  {defaultAddress ? (
                    <>
                      <Text className="text-[15px] font-bold text-ink">{defaultAddress.label}</Text>
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
                <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
              </Pressable>
            )}

            <TextField
              label="¿A dónde debe ir el domiciliario y qué debe hacer?"
              icon="clipboard-outline"
              format="sentence"
              value={description}
              onChangeText={bind('description', setDescription)}
              error={errors.description}
              placeholder="Ej: Farmacia La Colonial, comprar acetaminofén de 500 mg"
              multiline
              numberOfLines={3}
              maxLength={500}
              showCharCount
            />
            <TextField
              label="Notas adicionales (opcional)"
              icon="chatbubble-ellipses-outline"
              format="sentence"
              value={notes}
              onChangeText={bind('notes', setNotes)}
              error={errors.notes}
              placeholder="Ej: Preguntar por Don José en la caja"
              multiline
              numberOfLines={2}
              maxLength={500}
            />

            <TextField
              label="¿Hay que comprar algo? Valor aproximado (opcional)"
              icon="cart-outline"
              format="cop"
              value={purchase}
              onChangeText={bind('purchaseAmount', setPurchase)}
              error={errors.purchaseAmount}
              placeholder="Ej: 12.000"
            />
            <Text className="-mt-2 mb-4 text-xs text-muted">
              El domiciliario adelanta la compra y se la devuelves al recibir, según la
              factura. Máximo {formatPrice(ERRAND_MAX_PURCHASE)}.
            </Text>

            <Text className="mb-2 text-sm font-bold text-ink">¿Cómo le pagas al domiciliario?</Text>
            <FilterChips
              options={[
                { value: 'EFEC', label: 'Efectivo' },
                { value: 'NEQUI', label: 'Nequi' },
              ]}
              value={payment}
              onChange={setPayment}
            />
            <Text className="mb-4 mt-2 text-xs text-muted">
              {payment === 'NEQUI'
                ? 'Cuando un domiciliario tome tu mandado verás su número y llave de Nequi para pagarle al recibir.'
                : 'Le pagas en efectivo al domiciliario cuando te entregue.'}
            </Text>

            <TextField
              label="¿Cuánto ofreces por el mandado?"
              icon="cash-outline"
              format="cop"
              value={offered}
              onChangeText={(v) => {
                clearError('offeredFee');
                setOffered(v);
              }}
              error={errors.offeredFee}
              placeholder="Ej: 15.000"
            />
            <View className="-mt-2 mb-5 flex-row items-center gap-2">
              <Text className="flex-1 text-xs text-muted">
                {loadingMin
                  ? 'Calculando el mínimo…'
                  : minimum
                    ? `Mínimo ${formatPrice(minimum.fee)} según la distancia${
                        minimum.reasons.length ? ` (incluye ${minimum.reasons.join(', ')})` : ''
                      }. Ofrecer más hace que lo tomen más rápido.`
                    : 'Elige la dirección de entrega para calcular el mínimo.'}
              </Text>
              {!!minimum && offeredValue !== minimum.fee && (
                <Pressable
                  onPress={() => setOffered(formatText('cop', String(Math.round(minimum.fee))))}
                  hitSlop={6}
                  className="active:opacity-60"
                >
                  <Text className="text-xs font-bold text-primary">Usar mínimo</Text>
                </Pressable>
              )}
            </View>

            {/* Resumen */}
            <View className="rounded-2xl bg-surface p-4">
              <AmountRow label="Mandado" value={formatPrice(offeredValue)} />
              {purchaseValue > 0 && (
                <AmountRow label="Compra (aprox.)" value={formatPrice(purchaseValue)} />
              )}
              <View className="my-2 h-px bg-border" />
              <AmountRow label="Total al domiciliario" value={formatPrice(total)} bold />
            </View>
          </KeyboardAwareScrollView>

          {/* Publicar */}
          <View className="border-t border-border px-5 pb-6 pt-3">
            <Pressable
              onPress={submit}
              disabled={submitting || loadingMin}
              className={`h-[54px] flex-row items-center justify-center gap-2 overflow-hidden rounded-2xl active:opacity-80 ${
                submitting || loadingMin ? 'opacity-60' : ''
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
                <Text className="text-base font-extrabold text-white">
                  Publicar mandado · {formatPrice(total)}
                </Text>
              )}
            </Pressable>
          </View>

          <AddressSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
          <AddressMapPicker
            visible={mapVisible}
            initialCoords={
              pickup?.coords ??
              (defaultAddress?.latitude != null && defaultAddress?.longitude != null
                ? { latitude: defaultAddress.latitude, longitude: defaultAddress.longitude }
                : undefined)
            }
            onClose={() => setMapVisible(false)}
            onConfirm={handlePickup}
          />
        </>
      )}
    </SafeAreaView>
  );
}
