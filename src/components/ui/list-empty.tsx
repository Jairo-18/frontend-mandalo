import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  /** Botón opcional debajo del mensaje (ej. "Activar ubicación"). */
  actionLabel?: string;
  onAction?: () => void;
};

/** Estado vacío de los listados (icono + mensaje centrados, botón opcional). */
export function ListEmpty({ icon, message, actionLabel, onAction }: Props) {
  const colors = useResolvedAppColors();
  return (
    <View className="items-center pt-24">
      <Ionicons name={icon} size={44} color={colors.mutedColor} />
      <Text className="mt-3 px-8 text-center text-sm text-muted">{message}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-bold text-white">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
