import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogIconView, catalogIcon } from '@/lib/catalog-icon';
import { getAppColors } from '@/lib/app-colors';
import { ExploreFilterItem } from '@/services/explore';

type Props = {
  visible: boolean;
  onClose: () => void;
  tags: ExploreFilterItem[];
  categories: ExploreFilterItem[];
  selectedTagIds: number[];
  allSelected: boolean;
  selectedCategoryId: number | null;
  onToggleTag: (id: number) => void;
  onToggleAll: () => void;
  onSelectCategory: (id: number | null) => void;
  onClear: () => void;
};

/**
 * Hoja de filtros del home (botón junto al buscador): mismo estado que los
 * sliders "Negocios"/"Categorías" del layout (comparten los handlers), acá
 * en formato lista/select para elegir varias de un vistazo sin scrollear
 * horizontal.
 */
export function FilterSheet({
  visible,
  onClose,
  tags,
  categories,
  selectedTagIds,
  allSelected,
  selectedCategoryId,
  onToggleTag,
  onToggleAll,
  onSelectCategory,
  onClear,
}: Props) {
  const insets = useSafeAreaInsets();
  const { primaryColor, inkColor, mutedColor } = getAppColors();
  const hasActive =
    allSelected || selectedTagIds.length > 0 || selectedCategoryId != null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="max-h-[80%] rounded-t-[24px] bg-card px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-ink">Filtros</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={inkColor} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="mb-2 mt-4 text-[12px] font-extrabold uppercase tracking-wide text-muted">
            Negocios
          </Text>
          <FilterRow
            label="Todos los negocios"
            icon={{ family: 'ionicons', name: 'storefront-outline' }}
            selected={allSelected}
            multi={false}
            onPress={onToggleAll}
          />
          {tags.map((tag) => (
            <FilterRow
              key={tag.id}
              label={tag.name}
              icon={catalogIcon(tag.icon, 'pricetag-outline')}
              selected={selectedTagIds.includes(tag.id)}
              multi
              onPress={() => onToggleTag(tag.id)}
            />
          ))}

          {categories.length > 0 && (
            <>
              <Text className="mb-2 mt-5 text-[12px] font-extrabold uppercase tracking-wide text-muted">
                Categorías
              </Text>
              {categories.map((category) => {
                const selected = category.id === selectedCategoryId;
                return (
                  <FilterRow
                    key={category.id}
                    label={category.name}
                    icon={catalogIcon(category.icon, 'grid-outline')}
                    selected={selected}
                    multi={false}
                    onPress={() =>
                      onSelectCategory(selected ? null : category.id)
                    }
                  />
                );
              })}
            </>
          )}
        </ScrollView>

        <View className="mt-4 flex-row gap-3 border-t border-border pt-4">
          <Pressable
            onPress={onClear}
            disabled={!hasActive}
            className={`flex-1 items-center rounded-2xl border border-border py-3.5 active:opacity-70 ${
              hasActive ? '' : 'opacity-40'
            }`}
          >
            <Text className="text-[14px] font-bold text-ink">Limpiar</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="flex-1 items-center rounded-2xl bg-primary py-3.5 active:opacity-80"
          >
            <Text className="text-[14px] font-bold text-white">
              Ver resultados
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FilterRow({
  label,
  icon,
  selected,
  multi,
  onPress,
}: {
  label: string;
  icon: Parameters<typeof CatalogIconView>[0]['icon'];
  selected: boolean;
  multi: boolean;
  onPress: () => void;
}) {
  const { primaryColor, mutedColor } = getAppColors();
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 flex-row items-center gap-3 rounded-2xl border px-3.5 py-3 active:opacity-70 ${
        selected ? 'border-primary bg-primary-tint' : 'border-border bg-card'
      }`}
    >
      <CatalogIconView
        icon={icon}
        size={20}
        color={selected ? primaryColor : mutedColor}
      />
      <Text
        className={`flex-1 text-[14px] ${
          selected ? 'font-bold text-primary' : 'text-ink'
        }`}
      >
        {label}
      </Text>
      <Ionicons
        name={
          multi
            ? selected
              ? 'checkbox'
              : 'square-outline'
            : selected
              ? 'radio-button-on'
              : 'radio-button-off'
        }
        size={20}
        color={selected ? primaryColor : mutedColor}
      />
    </Pressable>
  );
}
