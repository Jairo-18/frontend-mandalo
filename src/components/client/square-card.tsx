import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

/**
 * Cuadrito de los sliders del home (Negocios y Categorías): card cuadrada
 * con icono + nombre; seleccionada se pinta del color primario.
 */
export function SquareCard({ label, icon, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-[84px] w-[84px] items-center justify-center rounded-2xl border px-1.5 ${
        selected ? 'border-primary bg-primary' : 'border-gray-200 bg-white'
      } active:opacity-80`}
    >
      <Ionicons
        name={icon}
        size={26}
        color={selected ? '#FFFFFF' : '#FF5A3C'}
      />
      <Text
        numberOfLines={2}
        className={`mt-1.5 text-center text-[11px] font-bold ${
          selected ? 'text-white' : 'text-dark'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Icono del catálogo validado contra Ionicons (con respaldo). */
export function catalogIcon(
  icon: string | null,
  fallback: keyof typeof Ionicons.glyphMap,
): keyof typeof Ionicons.glyphMap {
  return icon && icon in Ionicons.glyphMap
    ? (icon as keyof typeof Ionicons.glyphMap)
    : fallback;
}
