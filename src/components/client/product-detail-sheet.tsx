import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';
import { formatDistance } from '@/lib/distance';
import { finalPrice, formatPrice } from '@/lib/price';
import { DeliveryEstimate, ExploreProduct } from '@/services/explore';
import { getAppColors } from '@/lib/app-colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/default-images';

const CAROUSEL_HEIGHT = 280;

type Props = {
  /** Producto a mostrar; null = hoja cerrada. */
  product: ExploreProduct | null;
  /** Unidades de ESTE producto ya en el carrito. */
  quantity: number;
  onAdd: () => void;
  onDecrement: () => void;
  onClose: () => void;
  /** Distancia/ETA/tarifa al negocio que lo vende (estilo Rappi). */
  estimate?: DeliveryEstimate | null;
};

/**
 * Detalle de un producto dentro del negocio (vista del cliente): carrusel
 * con TODAS las fotos (tocar una la abre a pantalla completa), nombre,
 * precio con descuento, descripción completa y el control del carrito.
 * Se abre tocando la tarjeta del producto en la pantalla del negocio.
 */
export function ProductDetailSheet({
  product,
  quantity,
  onAdd,
  onDecrement,
  onClose,
  estimate,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Foto del carrusel visible (contador) y zoom a pantalla completa.
  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  // Cada producto arranca en su primera foto (la hoja queda montada).
  const productId = product?.id;
  useEffect(() => {
    setIndex(0);
  }, [productId]);

  const images = product?.images ?? [];
  const hasDiscount = (product?.discount ?? 0) > 0;
  const price = product ? finalPrice(product.priceSale, product.discount) : 0;

  return (
    <Modal
      visible={product != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop: tocar afuera cierra */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="max-h-[85%] overflow-hidden rounded-t-[24px] bg-card"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {/* Carrusel de fotos (remonta por producto para arrancar en la 1ª) */}
        <View>
          {images.length > 0 ? (
            <FlatList
              key={product?.id ?? 'closed'}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              onMomentumScrollEnd={(e) =>
                setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setPreview(item)}
                  className="bg-surface"
                  style={{ width, height: CAROUSEL_HEIGHT }}
                >
                  {/* `contain` (no `cover`): las fotos que suben los negocios
                      no siempre tienen esta proporción — con `cover` algunas
                      quedaban con zoom y recortadas sin verse completas. */}
                  <Image
                    source={{ uri: item }}
                    style={{ width, height: CAROUSEL_HEIGHT }}
                    resizeMode="contain"
                  />
                </Pressable>
              )}
            />
          ) : (
            <Image
              source={DEFAULT_PRODUCT_IMAGE}
              style={{ width, height: CAROUSEL_HEIGHT }}
              resizeMode="contain"
              className="bg-surface"
            />
          )}

          {images.length > 1 && (
            <View className="absolute bottom-3 self-center rounded-full bg-black/50 px-3 py-1">
              <Text className="text-xs font-bold text-white">
                {Math.min(index + 1, images.length)} / {images.length}
              </Text>
            </View>
          )}

          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="absolute right-4 top-4 h-9 w-9 items-center justify-center rounded-full bg-black/50"
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Datos del producto: flex:1 explícito para que se quede acotado
            entre el carrusel y el footer del carrito (ambos de alto fijo) y
            haga scroll de verdad — sin esto, una descripción larga se
            recortaba contra el `overflow-hidden` del contenedor en vez de
            poder verse completa. */}
        <ScrollView style={{ flex: 1 }} className="px-5 pt-4">
          <Text className="text-xl font-extrabold text-ink">
            {product?.name}
          </Text>

          {!!product?.categoryType?.name && (
            <Text className="mt-0.5 text-xs font-semibold text-muted">
              {product.categoryType.name}
            </Text>
          )}

          <View className="mt-2">
            {hasDiscount && product && (
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-muted line-through">
                  {formatPrice(product.priceSale)}
                </Text>
                <View className="rounded-full bg-primary-tint px-2 py-0.5">
                  <Text className="text-[11px] font-bold text-primary">
                    -{product.discount}%
                  </Text>
                </View>
              </View>
            )}
            <Text className="text-lg font-extrabold text-primary">
              {formatPrice(price)}
            </Text>
          </View>

          {estimate?.distanceKm != null && (
            <View className="mt-2 flex-row items-start gap-1.5">
              <Ionicons
                name="navigate-outline"
                size={13}
                color={getAppColors().mutedColor}
                style={{ marginTop: 1 }}
              />
              <Text className="flex-1 text-xs text-muted">
                {formatDistance(estimate.distanceKm)} de ti · ~{estimate.etaMinutes} min ·{' '}
                {formatPrice(estimate.deliveryFee ?? 0)} de domicilio
                {estimate.surchargeReasons.length > 0 && (
                  <Text className="font-bold text-primary">
                    {' '}
                    (incluye {estimate.surchargeReasons.join(', ')})
                  </Text>
                )}
              </Text>
            </View>
          )}

          {!!product?.description && (
            <Text className="mb-2 mt-3 text-sm leading-5 text-ink">
              {product.description}
            </Text>
          )}
        </ScrollView>

        {/* Carrito: agregar o ajustar cantidad */}
        <View className="px-5 pt-3">
          {quantity > 0 ? (
            <View className="h-[54px] flex-row items-center justify-between rounded-[30px] bg-primary-tint px-2.5">
              <Pressable
                onPress={onDecrement}
                hitSlop={6}
                className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
              >
                <Ionicons name="remove" size={20} color={getAppColors().primaryColor} />
              </Pressable>
              <Text className="text-base font-extrabold text-primary">
                {quantity} en el carrito
              </Text>
              <Pressable
                onPress={onAdd}
                hitSlop={6}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary active:opacity-80"
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <Button
              label={`Agregar al carrito · ${formatPrice(price)}`}
              onPress={onAdd}
            />
          )}
        </View>
      </View>

      {/* Zoom a pantalla completa de la foto tocada */}
      <PhotoPreviewModal
        uri={preview}
        uris={images}
        onClose={() => setPreview(null)}
      />
    </Modal>
  );
}
