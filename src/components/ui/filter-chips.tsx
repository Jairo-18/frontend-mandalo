import { Pressable, ScrollView, Text } from 'react-native';

export type FilterChipOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Fila horizontal de chips de selección única (elegir el campo de búsqueda,
 * filtros rápidos, etc.).
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1.5 ${
              selected
                ? 'border-primary bg-primary-tint'
                : 'border-gray-200 bg-white'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selected ? 'text-primary' : 'text-gray-600'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
