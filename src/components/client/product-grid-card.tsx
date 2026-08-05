import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { finalPrice, formatPrice } from '@/lib/price';
import { businessDisplayName, ExploreProduct } from '@/services/explore';
import { getAppColors } from '@/lib/app-colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/default-images';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  product: ExploreProduct;
  onPress?: () => void;
  /** Controles de carrito (pantalla del negocio): si se pasan, muestra +/stepper. */
  quantity?: number;
  onAdd?: () => void;
  onDecrement?: () => void;
};

/**
 * Tarjeta CUADRADA de producto para el grid de 2 columnas (home y tienda):
 * foto cuadrada arriba, nombre, precio (con descuento) y el negocio que lo
 * vende. Con `onAdd`/`onDecrement` (tienda) muestra el botón +/stepper del
 * carrito sobre la foto. Espejo compacto de `ProductCard` (fila).
 */
export function ProductGridCard({
  product,
  onPress,
  quantity = 0,
  onAdd,
  onDecrement,
}: Props) {
  const colors = useResolvedAppColors();
  const hasDiscount = product.discount > 0;
  const price = finalPrice(product.priceSale, product.discount);
  const img = product.images?.[0];
  const cartEnabled = !!onAdd;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl border border-border bg-card active:opacity-80"
    >
      <View className="w-full bg-surface" style={{ aspectRatio: 1 }}>
        <Image
          source={img ? { uri: img } : DEFAULT_PRODUCT_IMAGE}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {hasDiscount && (
          <View className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-[11px] font-extrabold text-white">
              -{product.discount}%
            </Text>
          </View>
        )}
        {product.organizational?.isOpen === false && (
          <View className="absolute right-2 top-2 rounded-full bg-dark px-2 py-0.5">
            <Text className="text-[10px] font-bold text-white">Cerrado</Text>
          </View>
        )}

        {/* Carrito (tienda): + para agregar / stepper si ya hay unidades. */}
        {cartEnabled && (
          <View className="absolute bottom-2 right-2">
            {quantity > 0 ? (
              <View className="flex-row items-center gap-1.5 rounded-full bg-card px-1.5 py-1 shadow">
                <Pressable
                  onPress={onDecrement}
                  hitSlop={6}
                  className="h-6 w-6 items-center justify-center rounded-full bg-primary-tint active:opacity-70"
                >
                  <Ionicons name="remove" size={14} color={colors.primaryColor} />
                </Pressable>
                <Text className="min-w-[14px] text-center text-[13px] font-extrabold text-ink">
                  {quantity}
                </Text>
                <Pressable
                  onPress={onAdd}
                  hitSlop={6}
                  className="h-6 w-6 items-center justify-center rounded-full bg-primary active:opacity-80"
                >
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={onAdd}
                hitSlop={6}
                className="h-9 w-9 items-center justify-center rounded-full bg-primary shadow active:opacity-80"
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View className="p-2.5">
        <Text numberOfLines={2} className="min-h-[36px] text-[13px] font-bold text-ink">
          {product.name}
        </Text>
        <View className="mt-1 flex-row items-center gap-1.5">
          <Text className="text-[15px] font-extrabold text-primary">
            {formatPrice(price)}
          </Text>
          {hasDiscount && (
            <Text className="text-[11px] text-muted line-through">
              {formatPrice(product.priceSale)}
            </Text>
          )}
        </View>
        {!!product.organizational && (
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="storefront-outline" size={11} color={colors.mutedColor} />
            <Text
              numberOfLines={1}
              className="shrink text-[11px] font-semibold text-muted"
            >
              {businessDisplayName(product.organizational)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
