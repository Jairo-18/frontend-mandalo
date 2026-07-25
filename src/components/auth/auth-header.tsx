import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getAppColors } from '@/lib/app-colors';

const WHITE = '#FFFFFF';

type Props = {
  subtitle?: string;
  /** Versión más baja para pantallas con más contenido (p. ej. registro). */
  compact?: boolean;
  /**
   * Si se pasa, muestra una flecha de "volver" arriba a la izquierda. Se usa
   * en las pantallas del flujo de auth (registro, recuperar contraseña,
   * completar registro) para regresar sin depender de tocar "Iniciar sesión".
   */
  onBack?: () => void;
};

export function AuthHeader({
  subtitle = 'Putumayo a tu puerta',
  compact = false,
  onBack,
}: Props) {
  const { primaryColor, darkColor } = getAppColors();

  return (
    <LinearGradient
      colors={[WHITE, primaryColor, primaryColor]}
      // El colchón inferior debe cubrir el solape de la tarjeta blanca de las
      // pantallas (-mt-7 = 28px) + un margen visible bajo el subtítulo; con
      // menos, el blanco tapa el texto del header.
      style={{ paddingHorizontal: 28, paddingBottom: compact ? 40 : 60 }}
    >
      <SafeAreaView edges={['top']}>
        <View className="mt-1 flex-row items-center justify-between">
          {!!onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm active:opacity-70"
            >
              <Ionicons name="arrow-back" size={22} color={darkColor} />
            </Pressable>
          ) : (
            <View />
          )}
          <ThemeToggle
            className="h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm active:opacity-70"
            iconColor={darkColor}
          />
        </View>
        <View className="pt-1">
          <View className="mb-3 mt-2 h-[60px] w-[60px] items-center justify-center self-center rounded-full bg-card shadow-md">
            <Ionicons name="bag-handle" size={28} color={primaryColor} />
          </View>
          {/* Sobre el degradado de marca (blanco→naranja) SIEMPRE fijo, no
              sobre bg-surface/bg-card: el texto debe quedar navy fijo, no
              aclararse en modo oscuro (se volvería invisible). */}
          <Text className="text-[50px] font-extrabold tracking-tighter text-dark">
            Mándalo.
          </Text>
          <Text className="mt-0.5 text-lg font-extrabold text-dark">{subtitle}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
