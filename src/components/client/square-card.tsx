import { Pressable, Text, View } from 'react-native';

import { CatalogIconRef, CatalogIconView } from '@/lib/catalog-icon';
import { getAppColors } from '@/lib/app-colors';

type Props = {
  label: string;
  icon: CatalogIconRef;
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
      className={`h-[104px] w-[96px] items-center justify-center rounded-2xl border px-1.5 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card'
      } active:opacity-80`}
    >
      {/* Icono en círculo de acento (blanco translúcido al seleccionar) */}
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${
          selected ? 'bg-white/25' : 'bg-primary-tint'
        }`}
      >
        <CatalogIconView
          icon={icon}
          size={26}
          color={selected ? '#FFFFFF' : getAppColors().primaryColor}
        />
      </View>
      <Text
        numberOfLines={2}
        className={`mt-2 text-center text-[13px] font-bold ${
          selected ? 'text-white' : 'text-ink'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
