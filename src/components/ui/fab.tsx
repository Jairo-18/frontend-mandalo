import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

/** Botón flotante de crear (queda arriba del paginador). Degradado de marca
 * (antes `bg-primary` sólido). */
export function Fab({ onPress, icon = 'add' }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useResolvedAppColors();
  return (
    <Pressable
      onPress={onPress}
      className="absolute right-5 h-14 w-14 overflow-hidden rounded-full shadow-lg active:opacity-80"
      style={{ bottom: insets.bottom + 76 }}
    >
      <LinearGradient
        colors={[colors.primaryColor, colors.darkColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={icon} size={30} color="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  );
}
