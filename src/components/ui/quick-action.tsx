import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { getAppColors } from '@/lib/app-colors';

/**
 * Botón chico de acceso directo a una sección (icono + etiqueta) — para
 * secciones que no tienen tarjeta-contador propia en el dashboard (p. ej.
 * Etiquetas/Categorías/Aplicación en admin) y solo estarían a un tap del
 * drawer. Se usa en los 3 dashboards (admin/negocio) y en el inicio del
 * repartidor.
 */
export function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-[31%] flex-grow items-center gap-1.5 rounded-2xl border border-border bg-card p-3 active:opacity-80"
    >
      <View className="h-9 w-9 items-center justify-center">
        <Ionicons name={icon} size={22} color={getAppColors().primaryColor} />
      </View>
      <Text numberOfLines={1} className="text-center text-xs font-semibold text-ink">
        {label}
      </Text>
    </Pressable>
  );
}
