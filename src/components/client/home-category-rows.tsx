import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { ProductGridCard } from '@/components/client/product-grid-card';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useWebHorizontalScroll } from '@/hooks/use-web-horizontal-scroll';
import { ExploreProduct, HomeRow } from '@/services/explore';

type Props = {
  rows: HomeRow[];
  onOpenProduct: (product: ExploreProduct) => void;
  /** "Ver todo": abre la cuadrícula filtrada por esa categoría. */
  onSeeAll: (categoryTypeId: number) => void;
};

/** Ancho de cada tarjeta en la fila: ~2.3 visibles en celular (se intuye el scroll). */
function cardWidth(screenWidth: number): number {
  if (screenWidth >= 1100) return 200;
  if (screenWidth >= 700) return 180;
  return Math.round((screenWidth - 40) / 2.3);
}

/**
 * Filas del home por CATEGORÍA ("Pollo", "Pizza", "Bebidas"…): cada una
 * mezcla productos de todos los negocios cercanos, ya rankeados por el
 * backend (abiertos, más pedidos, calificación…), con "Ver todo" para la
 * cuadrícula completa de esa categoría (ahí siguen los filtros).
 */
export function HomeCategoryRows({ rows, onOpenProduct, onSeeAll }: Props) {
  const width = cardWidth(useWindowDimensions().width);
  if (!rows.length) return null;
  return (
    <View className="pb-2">
      {rows.map((row) => (
        <CategoryRow
          key={row.categoryType.id}
          row={row}
          cardWidth={width}
          onOpenProduct={onOpenProduct}
          onSeeAll={onSeeAll}
        />
      ))}
    </View>
  );
}

function CategoryRow({
  row,
  cardWidth: width,
  onOpenProduct,
  onSeeAll,
}: {
  row: HomeRow;
  cardWidth: number;
  onOpenProduct: (product: ExploreProduct) => void;
  onSeeAll: (categoryTypeId: number) => void;
}) {
  const colors = useResolvedAppColors();
  // Web: rueda del mouse y arrastre mueven la fila.
  const webScrollRef = useWebHorizontalScroll();
  return (
    <View className="pb-3">
      <View className="mb-2 flex-row items-center justify-between px-5">
        <Text className="text-[16px] font-extrabold text-ink">{row.categoryType.name}</Text>
        <Pressable
          onPress={() => onSeeAll(row.categoryType.id)}
          hitSlop={8}
          className="flex-row items-center gap-0.5 active:opacity-60"
        >
          <Text className="text-[13px] font-bold text-primary">Ver todo</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primaryColor} />
        </Pressable>
      </View>
      <ScrollView
        ref={webScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
      >
        {row.products.map((product) => (
          <View key={product.id} style={{ width }}>
            <ProductGridCard product={product} onPress={() => onOpenProduct(product)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
