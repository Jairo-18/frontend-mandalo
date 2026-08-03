import { Pressable, Text } from 'react-native';

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
      <CatalogIconView
        icon={icon}
        size={30}
        color={selected ? '#FFFFFF' : getAppColors().primaryColor}
      />
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
