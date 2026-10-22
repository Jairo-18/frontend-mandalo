import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { formatPrice } from '@/lib/price';
import { Promotion, promotionContents } from '@/services/promotions';

type Props = {
  promo: Promotion;
  /** Unidades de ESTA promo ya en el carrito. */
  quantity: number;
  onAdd: () => void;
  onDecrement: () => void;
  /** Tocar la tarjeta abre el detalle (misma hoja que los productos). */
  onPress: () => void;
};

/**
 * Publicidad dentro de la tienda (arriba de los productos): banner, título,
 * mensaje, qué incluye y precio con el normal tachado. Se agrega al carrito
 * como UNA línea a su precio (`promotionAsCartProduct`).
 */
export function StorePromotionCard({ promo, quantity, onAdd, onDecrement, onPress }: Props) {
  const colors = useResolvedAppColors();
  const savings =
    promo.regularPrice > promo.price
      ? Math.round((1 - promo.price / promo.regularPrice) * 100)
      : 0;

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-2xl border border-border bg-card active:opacity-90"
    >
      <View className="w-full bg-surface" style={{ aspectRatio: 16 / 9 }}>
        {!!promo.imageUrl && (
          <Image
            source={{ uri: promo.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
          />
        )}
        {savings > 0 && (
          <View className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1">
            <Text className="text-[12px] font-extrabold text-white">Ahorra {savings}%</Text>
          </View>
        )}
      </View>

      <View className="p-3.5">
        <Text className="text-[16px] font-extrabold text-ink">{promo.title}</Text>
        {!!promo.message && (
          <Text className="mt-0.5 text-[13px] text-muted">{promo.message}</Text>
        )}
        <View className="mt-1.5 flex-row items-start gap-1.5">
          <Ionicons name="pricetags-outline" size={13} color={colors.mutedColor} style={{ marginTop: 2 }} />
          <Text className="flex-1 text-[12px] text-ink">{promotionContents(promo)}</Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between gap-3">
          <View>
            <Text className="text-[18px] font-extrabold text-primary">
              {formatPrice(promo.price)}
            </Text>
            {promo.regularPrice > promo.price && (
              <Text className="text-[12px] text-muted line-through">
                {formatPrice(promo.regularPrice)}
              </Text>
            )}
          </View>

          {quantity > 0 ? (
            <View className="flex-row items-center gap-2.5 rounded-full bg-primary-tint px-2 py-1.5">
              <Pressable
                onPress={onDecrement}
                hitSlop={6}
                className="h-8 w-8 items-center justify-center rounded-full bg-card active:opacity-70"
              >
                <Ionicons name="remove" size={18} color={colors.primaryColor} />
              </Pressable>
              <Text className="min-w-[18px] text-center text-[15px] font-extrabold text-ink">
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
              className="h-11 flex-row items-center gap-1.5 rounded-full bg-primary px-4 active:opacity-80"
            >
              <Ionicons name="cart-outline" size={17} color="#FFFFFF" />
              <Text className="text-[14px] font-bold text-white">Agregar</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
