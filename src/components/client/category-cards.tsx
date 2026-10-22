import { ScrollView } from 'react-native';

import { SquareCard } from '@/components/client/square-card';
import { catalogIcon } from '@/lib/catalog-icon';
import { ExploreFilterItem } from '@/services/explore';
import { useWebHorizontalScroll } from '@/hooks/use-web-horizontal-scroll';

type Props = {
  categories: ExploreFilterItem[];
  /** null = ninguna elegida (tocar la elegida la deselecciona). */
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

/**
 * Slider de categorías del home (cards cuadradas con icono): elegir una
 * muestra los productos de esa categoría en todos los negocios.
 */
export function CategoryCards({ categories, selectedId, onSelect }: Props) {
  const webScrollRef = useWebHorizontalScroll();

  return (
    <ScrollView
      // Web: rueda del mouse y arrastre mueven la fila (ver el hook).
      ref={webScrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}
    >
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <SquareCard
            key={category.id}
            label={category.name}
            icon={catalogIcon(category.icon, 'grid-outline')}
            selected={selected}
            onPress={() => onSelect(selected ? null : category.id)}
          />
        );
      })}
    </ScrollView>
  );
}
