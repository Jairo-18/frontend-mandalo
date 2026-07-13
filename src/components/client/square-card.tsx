import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

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
      className={`h-[88px] w-[84px] items-center justify-center rounded-2xl border px-1.5 ${
        selected ? 'border-primary bg-primary' : 'border-gray-100 bg-white'
      } active:opacity-80`}
    >
      {/* Icono en círculo de acento (blanco translúcido al seleccionar) */}
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          selected ? 'bg-white/25' : 'bg-primary-tint'
        }`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={selected ? '#FFFFFF' : '#FF5A3C'}
        />
      </View>
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
