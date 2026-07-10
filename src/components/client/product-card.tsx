import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { finalPrice, formatPrice } from '@/lib/price';
import { businessDisplayName, ExploreProduct } from '@/services/explore';

type Props = {
  product: ExploreProduct;
  /** En la búsqueda global: tocar la card lleva al negocio. */
  onPress?: () => void;
  /** Controles de carrito (pantalla del negocio). Si se pasan, muestra stepper. */
  quantity?: number;
  onAdd?: () => void;
  onDecrement?: () => void;
};

/**
 * Tarjeta de producto (vista del cliente): foto, nombre, descripción y
 * precio con el descuento aplicado. Si el producto trae `organizational`
 * (búsqueda global del home) muestra debajo qué negocio lo vende. Cuando se
 * pasan `onAdd`/`onDecrement` (pantalla del negocio) muestra el stepper del
 * carrito a la derecha.
 */
export function ProductCard({
  product,
  onPress,
  quantity = 0,
  onAdd,
  onDecrement,
}: Props) {
  const hasDiscount = product.discount > 0;
  const price = finalPrice(product.priceSale, product.discount);
  const cartEnabled = !!onAdd;
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl bg-white p-3.5 active:opacity-80"
    >
      <Avatar
        uri={product.images?.[0]}
        icon="cube-outline"
        size={64}
        shape="rounded"
      />

      <View className="flex-1">
        <Text numberOfLines={1} className="text-[15px] font-bold text-dark">
          {product.name}
        </Text>

        {!!product.description && (
          <Text numberOfLines={2} className="mt-0.5 text-xs text-muted">
            {product.description}
          </Text>
        )}

        <View className="mt-1 flex-row items-center gap-2">
          <Text className="text-sm font-extrabold text-primary">
            {formatPrice(price)}
          </Text>
          {hasDiscount && (
            <>
              <Text className="text-xs text-muted line-through">
                {formatPrice(product.priceSale)}
              </Text>
              <View className="rounded-full bg-primary-tint px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-primary">
                  -{product.discount}%
                </Text>
              </View>
            </>
          )}
        </View>

        {product.organizational ? (
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="storefront-outline" size={12} color="#7A7A8A" />
            <Text numberOfLines={1} className="flex-1 text-[11px] font-semibold text-muted">
              {businessDisplayName(product.organizational)}
            </Text>
          </View>
        ) : (
          !!product.categoryType?.name && (
            <Text numberOfLines={1} className="mt-0.5 text-[11px] text-muted">
              {product.categoryType.name}
            </Text>
          )
        )}
      </View>

      {cartEnabled ? (
        quantity > 0 ? (
          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={onDecrement}
              hitSlop={6}
              className="h-8 w-8 items-center justify-center rounded-full bg-primary-tint active:opacity-70"
            >
              <Ionicons name="remove" size={18} color="#FF5A3C" />
            </Pressable>
            <Text className="min-w-[18px] text-center text-[15px] font-extrabold text-dark">
              {quantity}
            </Text>
            <Pressable
              onPress={onAdd}
              hitSlop={6}
              className="h-8 w-8 items-center justify-center rounded-full bg-primary active:opacity-80"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAdd}
            hitSlop={6}
            className="h-9 w-9 items-center justify-center rounded-full bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        )
      ) : (
        onPress && <Ionicons name="chevron-forward" size={18} color="#C9C9D4" />
      )}
    </Wrapper>
  );
}
