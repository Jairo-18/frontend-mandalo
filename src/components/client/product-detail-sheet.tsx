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
import { finalPrice, formatPrice } from '@/lib/price';
import { ExploreProduct } from '@/services/explore';

const CAROUSEL_HEIGHT = 280;

type Props = {
  /** Producto a mostrar; null = hoja cerrada. */
  product: ExploreProduct | null;
  /** Unidades de ESTE producto ya en el carrito. */
  quantity: number;
  onAdd: () => void;
  onDecrement: () => void;
  onClose: () => void;
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
        className="max-h-[85%] overflow-hidden rounded-t-[24px] bg-white"
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
                <Pressable onPress={() => setPreview(item)}>
                  <Image
                    source={{ uri: item }}
                    style={{ width, height: CAROUSEL_HEIGHT }}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
            />
          ) : (
            <View
              className="items-center justify-center bg-surface"
              style={{ width, height: CAROUSEL_HEIGHT }}
            >
              <Ionicons name="cube-outline" size={48} color="#C9C9D4" />
            </View>
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

        {/* Datos del producto */}
        <ScrollView className="px-5 pt-4">
          <Text className="text-xl font-extrabold text-dark">
            {product?.name}
          </Text>

          {!!product?.categoryType?.name && (
            <Text className="mt-0.5 text-xs font-semibold text-muted">
              {product.categoryType.name}
            </Text>
          )}

          <View className="mt-2 flex-row items-center gap-2.5">
            <Text className="text-lg font-extrabold text-primary">
              {formatPrice(price)}
            </Text>
            {hasDiscount && product && (
              <>
                <Text className="text-sm text-muted line-through">
                  {formatPrice(product.priceSale)}
                </Text>
                <View className="rounded-full bg-primary-tint px-2 py-0.5">
                  <Text className="text-[11px] font-bold text-primary">
                    -{product.discount}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {!!product?.description && (
            <Text className="mb-2 mt-3 text-sm leading-5 text-dark">
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
                className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
              >
                <Ionicons name="remove" size={20} color="#FF5A3C" />
              </Pressable>
              <Text className="text-base font-extrabold text-dark">
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
