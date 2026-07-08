import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type Item = { id: number; name: string };

type Props = {
  label: string;
  items: Item[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** Mensaje cuando no hay items para elegir. */
  emptyMessage?: string;
};

/** Multi-selección con chips (p. ej. las etiquetas del negocio). */
export function ChipMultiSelect({
  label,
  items,
  selectedIds,
  onToggle,
  emptyMessage,
}: Props) {
  return (
    <>
      <Text className="mb-2 text-sm font-bold text-gray-700">{label}</Text>
      {items.length === 0 ? (
        <Text className="mb-4 text-sm text-muted">
          {emptyMessage ?? 'No hay opciones disponibles.'}
        </Text>
      ) : (
        <View className="mb-4 flex-row flex-wrap gap-2">
          {items.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggle(item.id)}
                className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
                  selected
                    ? 'border-primary bg-primary-tint'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {selected && (
                  <Ionicons name="checkmark" size={14} color="#FF5A3C" />
                )}
                <Text
                  className={`text-[13px] font-semibold ${
                    selected ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );
}
