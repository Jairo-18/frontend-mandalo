import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { StarRating } from '@/components/reviews/star-rating';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { formatDistance } from '@/lib/distance';
import { finalPrice, formatPrice } from '@/lib/price';
import { businessDisplayName, DeliveryEstimate, ExploreProduct } from '@/services/explore';
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
  /**
   * Distancia/ETA al negocio que lo vende (estilo Rappi). En la pantalla de
   * un solo negocio es el mismo valor para todas las tarjetas (además ya
   * sale una vez en la cabecera); en el home cada tarjeta trae el de SU
   * propio negocio.
   */
  estimate?: DeliveryEstimate | null;
  /**
   * Sin las filas del negocio (nombre + estrellas): dentro de la tienda todos
   * los productos son del mismo negocio y esas filas solo dejaban espacio en
   * blanco. La tarjeta queda más baja (alto fijo propio, igual en todo el grid).
   */
  compact?: boolean;
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
  estimate,
  compact = false,
}: Props) {
  const colors = useResolvedAppColors();
  const hasDiscount = product.discount > 0;
  const price = finalPrice(product.priceSale, product.discount);
  const img = product.images?.[0];
  const cartEnabled = !!onAdd;

  return (
    <Pressable
      onPress={onPress}
      // SIN `flex-1` a propósito. La tarjeta tiene altura PROPIA: foto cuadrada
      // (aspectRatio 1) + bloque de texto en alto fijo. Con `flex-1` su altura
      // pasaba a depender de la celda, que a su vez es `flex: 1` — nadie
      // aportaba una altura intrínseca y la única pista real (el aspectRatio)
      // necesita el ancho ya medido. En las pasadas de layout donde ese ancho
      // aún no está resuelto la tarjeta salía en CERO y solo se pintaba su
      // borde: las "líneas rojas" que aparecían al hacer scroll brusco.
      className="mb-3 overflow-hidden rounded-2xl border border-border bg-card active:opacity-80"
    >
      <View className="w-full bg-surface" style={{ aspectRatio: 1 }}>
        <Image
          source={img ? { uri: img } : DEFAULT_PRODUCT_IMAGE}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          // La celda se recicla al hacer scroll: sin `recyclingKey` la tarjeta
          // nueva muestra por un frame la foto del producto anterior.
          recyclingKey={String(product.id)}
          cachePolicy="memory-disk"
          transition={150}
        />

        {/* Insignias a la izquierda (descuento, cerrado); el corazón a la derecha. */}
        <View className="absolute left-2 top-2 items-start gap-1">
          {hasDiscount && (
            <View className="rounded-full bg-primary px-2 py-0.5">
              <Text className="text-[11px] font-extrabold text-white">
                -{product.discount}%
              </Text>
            </View>
          )}
          {product.organizational?.isOpen === false && (
            <View className="rounded-full bg-dark px-2 py-0.5">
              <Text className="text-[10px] font-bold text-white">Cerrado</Text>
            </View>
          )}
        </View>
        {/* Las promos del carrito (id negativo) no son favoritos. */}
        {product.id > 0 && (
          <View className="absolute right-2 top-2">
            <FavoriteButton kind="product" id={product.id} size={30} />
          </View>
        )}

        {/* Tiene video (se ve en el detalle). */}
        {!!product.videoUrl && (
          <View className="absolute bottom-2 left-2 h-7 w-7 items-center justify-center rounded-full bg-black/55">
            <Ionicons name="videocam" size={14} color="#FFFFFF" />
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

      {/* Alto FIJO, no mínimo: la foto ya mide siempre lo mismo (aspectRatio 1
          sobre celdas de igual ancho), así que fijando este bloque todas las
          tarjetas del grid miden idéntico, tengan o no descuento, negocio o
          estimado de entrega.

          Tiene que ser `h-` y no `min-h-`: con mínimos, una tarjeta cuyo texto
          se pasaba por poco crecía y dejaba a las vecinas "chicas" dentro de su
          celda ya estirada. Con alto fijo + `numberOfLines` topados nada puede
          empujar. Suma de las partes: 10 padding + 26 nombre + 32 precio +
          18 negocio + 14 estrellas + 17 entrega + 10 padding = 127, con 3px
          de holgura. */}
      {/* Compacta: 10 padding + 26 nombre + 32 precio + 17 entrega + 10
          padding = 95 (+3 de holgura). */}
      <View className={`${compact ? 'h-[98px]' : 'h-[130px]'} p-2.5`}>
        <Text
          numberOfLines={2}
          className="h-[26px] text-[11px] font-bold leading-[13px] text-ink"
        >
          {product.name}
        </Text>
        <View className="mt-1 h-[32px]">
          {hasDiscount && (
            <Text className="text-[10px] text-muted line-through">
              {formatPrice(product.priceSale)}
            </Text>
          )}
          <Text className="text-[13px] font-extrabold text-primary">
            {formatPrice(price)}
          </Text>
        </View>
        {!compact && !!product.organizational && (
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
        {/* Calificación del negocio debajo de su nombre: 5 estrellas que se
            rellenan según el promedio (con medias). Siempre presente para que
            todas las tarjetas midan igual: sin reseñas, vacías + "Nuevo". */}
        {!compact && !!product.organizational && (
          <View className="mt-0.5 h-[12px] flex-row items-center gap-1">
            <StarRating value={product.organizational.ratingAverage ?? 0} size={10} />
            <Text className="text-[9px] font-semibold text-muted">
              {product.organizational.ratingCount
                ? `(${product.organizational.ratingCount})`
                : 'Nuevo'}
            </Text>
          </View>
        )}
        {estimate?.distanceKm != null && (
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="navigate-outline" size={10} color={colors.mutedColor} />
            <Text className="text-[10px] font-semibold text-muted">
              {formatDistance(estimate.distanceKm)} · ~{estimate.etaMinutes} min
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
