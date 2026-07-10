import { ScrollView } from 'react-native';

import { catalogIcon, SquareCard } from '@/components/client/square-card';
import { ExploreFilterItem } from '@/services/explore';

type Props = {
  tags: ExploreFilterItem[];
  selectedIds: number[];
  /** Card "Todos" activa = mostrar todos los negocios (sin filtrar por tag). */
  allSelected: boolean;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
};

/**
 * Slider de etiquetas de negocio (sección "Negocios" del home): cards
 * cuadradas "Todos" (todos los negocios) + una por etiqueta, con su icono.
 * Elegir una muestra el listado de negocios de ese tipo (multi-selección).
 */
export function TagCards({
  tags,
  selectedIds,
  allSelected,
  onToggle,
  onToggleAll,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}
    >
      <SquareCard
        label="Todos"
        icon="storefront-outline"
        selected={allSelected}
        onPress={onToggleAll}
      />

      {tags.map((tag) => (
        <SquareCard
          key={tag.id}
          label={tag.name}
          icon={catalogIcon(tag.icon, 'pricetag-outline')}
          selected={selectedIds.includes(tag.id)}
          onPress={() => onToggle(tag.id)}
        />
      ))}
    </ScrollView>
  );
}
