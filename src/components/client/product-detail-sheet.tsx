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
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';
import { formatDistance } from '@/lib/distance';
import { finalPrice, formatPrice } from '@/lib/price';
import { DeliveryEstimate, ExploreProduct } from '@/services/explore';
import { getAppColors } from '@/lib/app-colors';
import { ProductVideo } from '@/components/ui/product-video';
import { useSwipeDownToClose } from '@/components/ui/swipe-down-to-close';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/default-images';
import { Promotion } from '@/services/promotions';

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
  /**
   * Si `product` es una promo (`promotionAsCartProduct`): muestra su mensaje,
   * el precio normal tachado con el ahorro y los productos que incluye.
   */
  promotion?: Promotion | null;
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
  promotion,
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
  // El video (si hay) es la primera diapositiva; después las fotos.
  const slides: { key: string; kind: 'video' | 'image'; uri: string }[] = [
    ...(product?.videoUrl
      ? [{ key: `v-${product.videoUrl}`, kind: 'video' as const, uri: product.videoUrl }]
      : []),
    ...images.map((uri) => ({ key: uri, kind: 'image' as const, uri })),
  ];
  const hasDiscount = (product?.discount ?? 0) > 0;
  const price = product ? finalPrice(product.priceSale, product.discount) : 0;
  const promoSavings =
    promotion && promotion.regularPrice > promotion.price
      ? Math.round((1 - promotion.price / promotion.regularPrice) * 100)
      : 0;

  // Arrastrar la foto/video de arriba hacia abajo cierra la hoja (además de
  // la X y tocar afuera). Solo esa zona: abajo hay un scroll de texto.
  const swipe = useSwipeDownToClose({ visible: product != null, onClose });

  return (
    <Modal
      visible={product != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* GestureHandlerRootView: dentro de un Modal (Android) los gestos no
          llegan sin su propia raíz. */}
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
      {/* Backdrop a pantalla COMPLETA (detrás de la hoja), no solo el espacio
          de arriba: si no, al arrastrar la hoja hacia abajo quedaba una
          franja sin oscurecer entre el fondo y la hoja. Tocar afuera cierra. */}
      <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />

      {/* Sin esquinas redondeadas: la foto/video de arriba va a ras, sin
          recortes (pedido del cliente 2026-10-21). */}
      <Animated.View
        className="max-h-[85%] overflow-hidden bg-card"
        style={[{ paddingBottom: insets.bottom + 16 }, swipe.animatedStyle]}
      >
        {/* Carrusel de fotos (remonta por producto para arrancar en la 1ª).
            Es la zona que se agarra para cerrar arrastrando hacia abajo. */}
        <GestureDetector gesture={swipe.gesture}>
        <View>
          {slides.length > 0 ? (
            <FlatList
              key={product?.id ?? 'closed'}
              data={slides}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              onMomentumScrollEnd={(e) =>
                setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
              }
              renderItem={({ item, index: slideIndex }) =>
                item.kind === 'video' ? (
                  // Video completo (contain) en toda el área: el 4:3 horizontal
                  // casi la llena. Suena solo si el cliente lo activa; se
                  // pausa al pasar a una foto.
                  <ProductVideo
                    url={item.uri}
                    thumbnailUrl={product?.videoThumbnailUrl}
                    width={width}
                    height={CAROUSEL_HEIGHT}
                    active={product != null && index === slideIndex}
                  />
                ) : (
                <Pressable
                  onPress={() => setPreview(item.uri)}
                  className="bg-surface"
                  style={{ width, height: CAROUSEL_HEIGHT }}
                >
                  {/* `contain` (no `cover`): las fotos que suben los negocios
                      no siempre tienen esta proporción — con `cover` algunas
                      quedaban con zoom y recortadas sin verse completas. */}
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width, height: CAROUSEL_HEIGHT }}
                    resizeMode="contain"
                  />
                </Pressable>
                )
              }
            />
          ) : (
            <Image
              source={DEFAULT_PRODUCT_IMAGE}
              style={{ width, height: CAROUSEL_HEIGHT }}
              resizeMode="contain"
              className="bg-surface"
            />
          )}

          {slides.length > 1 && (
            <View className="absolute bottom-3 self-center rounded-full bg-black/50 px-3 py-1">
              <Text className="text-xs font-bold text-white">
                {Math.min(index + 1, slides.length)} / {slides.length}
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

          {/* Agarradera: avisa que se puede arrastrar hacia abajo. */}
          <View
            pointerEvents="none"
            className="absolute top-2 h-1.5 w-10 self-center rounded-full bg-white/80"
          />
        </View>
        </GestureDetector>

        {/* Datos del producto: mide lo que mide su contenido y, si no cabe en
            la hoja (alto MÁXIMO 85%, no fijo), se encoge y hace scroll.
            ⚠️ NO `flex: 1`: en RN eso es flexBasis 0 y, como la hoja no tiene
            alto fijo, el bloque quedaba en 0 de alto — la descripción (y el
            nombre/precio) no se veían. */}
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} className="px-5 pt-4">
          <View className="flex-row items-start gap-3">
            <Text className="flex-1 text-xl font-extrabold text-ink">
              {product?.name}
            </Text>
            {/* Promos (id negativo) no son favoritos. */}
            {!!product && product.id > 0 && (
              <View className="rounded-full bg-surface">
                <FavoriteButton
                  kind="product"
                  id={product.id}
                  size={38}
                  variant="plain"
                  color={getAppColors().inkColor}
                />
              </View>
            )}
          </View>

          {!!product?.categoryType?.name && (
            <Text className="mt-0.5 text-xs font-semibold text-muted">
              {product.categoryType.name}
            </Text>
          )}

          {!!promotion?.message && (
            <Text className="mt-1 text-sm text-muted">{promotion.message}</Text>
          )}

          <View className="mt-2">
            {promoSavings > 0 && promotion && (
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-muted line-through">
                  {formatPrice(promotion.regularPrice)}
                </Text>
                <View className="rounded-full bg-primary-tint px-2 py-0.5">
                  <Text className="text-[11px] font-bold text-primary">
                    Ahorra {promoSavings}%
                  </Text>
                </View>
              </View>
            )}
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

          {promotion ? (
            <View className="mb-2 mt-3">
              <Text className="mb-1.5 text-sm font-bold text-ink">Incluye</Text>
              {promotion.items.map((item) => (
                <View key={item.productId} className="flex-row items-center gap-2.5 py-1.5">
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : DEFAULT_PRODUCT_IMAGE}
                    style={{ width: 44, height: 44, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                  <Text className="flex-1 text-sm text-ink" numberOfLines={2}>
                    <Text className="font-extrabold">{item.quantity}×</Text> {item.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : !!product?.description && (
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
      </Animated.View>
      </GestureHandlerRootView>

      {/* Zoom a pantalla completa de la foto tocada */}
      <PhotoPreviewModal
        uri={preview}
        uris={images}
        onClose={() => setPreview(null)}
      />
    </Modal>
  );
}
