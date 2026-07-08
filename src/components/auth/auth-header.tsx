import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORANGE = '#FF5A3C';
const ORANGE_SOFT = '#FF8C6E';
const WHITE = '#FFFFFF';

type Props = {
  subtitle?: string;
  /** Versión más baja para pantallas con más contenido (p. ej. registro). */
  compact?: boolean;
};

export function AuthHeader({
  subtitle = 'Putumayo a tu puerta',
  compact = false,
}: Props) {
  return (
    <LinearGradient
      colors={[WHITE, ORANGE_SOFT, ORANGE]}
      style={{ paddingHorizontal: 28, paddingBottom: compact ? 40 : 60 }}
    >
      <SafeAreaView edges={['top']}>
        <View className="pt-1">
          <View className="mb-3 mt-2 h-[60px] w-[60px] items-center justify-center self-center rounded-full bg-white shadow-md">
            <Ionicons name="bag-handle" size={28} color={ORANGE} />
          </View>
          <Text className="text-[38px] font-extrabold tracking-tighter text-dark">
            Mándalo.
          </Text>
          <Text className="mt-0.5 text-sm text-dark">{subtitle}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
