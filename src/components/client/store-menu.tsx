import { ReactNode, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { FilterChips } from '@/components/ui/filter-chips';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { ExploreProduct, MenuSection } from '@/services/explore';

type Props = {
  sections: MenuSection[];
  numColumns: number;
  /** Lo que va arriba de las secciones (promociones). */
  header?: ReactNode;
  renderProduct: (product: ExploreProduct) => ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  /** Espacio abajo (la barra flotante del carrito). */
  bottomPadding: number;
};

/** Margen entre el chip tocado y el título de su sección al bajar. */
const SCROLL_OFFSET = 8;

/**
 * Menú de la tienda por SECCIONES ("Más pedidos" + una por categoría, A–Z),
 * estilo Rappi: los chips de arriba son un ÍNDICE, no un filtro — tocar uno
 * baja hasta su sección sin ocultar nada, y al hacer scroll se resalta el
 * chip de la sección en la que vas. Cada sección es una cuadrícula de
 * `numColumns`. Sin paginar (el backend manda el menú completo).
 */
export function StoreMenu({
  sections,
  numColumns,
  header,
  renderProduct,
  refreshing,
  onRefresh,
  bottomPadding,
}: Props) {
  const colors = useResolvedAppColors();
  const scrollRef = useRef<ScrollView>(null);
  // Posición (y) de cada sección dentro del contenido, medida con onLayout.
  const offsets = useRef<Record<string, number>>({});
  const [active, setActive] = useState(sections[0]?.key ?? '');
  // Mientras baja por un toque de chip, el scroll no cambia el resaltado
  // (si no, el chip "salta" por las secciones intermedias).
  const jumpingTo = useRef<string | null>(null);

  function goTo(key: string) {
    const y = offsets.current[key];
    if (y == null) return;
    jumpingTo.current = key;
    setActive(key);
    scrollRef.current?.scrollTo({ y: Math.max(0, y - SCROLL_OFFSET), animated: true });
    setTimeout(() => {
      jumpingTo.current = null;
    }, 600);
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (jumpingTo.current) return;
    const y = e.nativeEvent.contentOffset.y + SCROLL_OFFSET + 1;
    let current = sections[0]?.key ?? '';
    for (const section of sections) {
      const top = offsets.current[section.key];
      if (top != null && top <= y) current = section.key;
    }
    if (current !== active) setActive(current);
  }

  return (
    <>
      {sections.length > 1 && (
        <View className="px-5 pb-2">
          <FilterChips
            options={sections.map((s) => ({ value: s.key, label: s.title }))}
            value={active}
            onChange={goTo}
          />
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-surface"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: bottomPadding }}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryColor}
          />
        }
      >
        {header}
        {sections.map((section) => (
          <View
            key={section.key}
            className="mb-2"
            onLayout={(e) => {
              offsets.current[section.key] = e.nativeEvent.layout.y;
            }}
          >
            <Text className="mb-2 text-[15px] font-extrabold text-ink">{section.title}</Text>
            {chunk(section.products, numColumns).map((row, i) => (
              <View key={`${section.key}-${i}`} className="flex-row gap-3">
                {row.map((product) => (
                  <View key={product.id} className="flex-1">
                    {renderProduct(product)}
                  </View>
                ))}
                {/* Relleno: la última fila incompleta no se estira. */}
                {Array.from({ length: numColumns - row.length }).map((_, k) => (
                  <View key={`pad-${k}`} className="flex-1" />
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}
