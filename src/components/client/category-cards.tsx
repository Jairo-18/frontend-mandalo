import { ScrollView } from 'react-native';

import { catalogIcon, SquareCard } from '@/components/client/square-card';
import { ExploreFilterItem } from '@/services/explore';

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
  return (
    <ScrollView
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
