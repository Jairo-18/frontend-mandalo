import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Tarjeta fija del home para "Pedir un mandado" (debajo del carrusel): es lo
 * más visible sin tocar el menú inferior. El invitado también la ve; la
 * pantalla del mandado le pide iniciar sesión.
 */
export function ErrandBanner({ onPress }: { onPress: () => void }) {
  const colors = useResolvedAppColors();
  return (
    <Pressable
      onPress={onPress}
      className="mx-5 mt-3 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-tint">
        <Ionicons name="walk-outline" size={22} color={colors.primaryColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-extrabold text-ink">¿Necesitas un mandado?</Text>
        <Text numberOfLines={2} className="text-[12px] text-muted">
          Compramos, recogemos o llevamos lo que necesites. Tú pones el precio.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
    </Pressable>
  );
}
