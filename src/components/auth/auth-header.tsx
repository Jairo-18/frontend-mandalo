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
  /**
   * Ancho máximo del CONTENIDO del header (el degradado sigue a todo el ancho).
   * Lo pasa `AuthShell` en pantalla ancha con el mismo ancho de la tarjeta del
   * formulario, para que el logo/título/botones queden alineados con ella en
   * vez de pegados al borde izquierdo de un monitor.
   */
  contentMaxWidth?: number;
};

export function AuthHeader({
  subtitle = 'Putumayo a tu puerta',
  compact = false,
  onBack,
  contentMaxWidth,
}: Props) {
  const { primaryColor, darkColor } = getAppColors();

  return (
    <LinearGradient
      // 3 paradas (antes solo llegaba a primaryColor y se quedaba plana ahí,
      // sin oscurecer): blanco→primario→oscuro, mismo patrón que los
      // degradados de sidebars/navbars (`[primaryColor, darkColor]`) — así
      // el header de login SÍ recorre todo el rango de marca, como el
      // degradado real del ícono de la app (rojo→vino oscuro).
      colors={[WHITE, primaryColor, darkColor]}
      // El colchón inferior debe cubrir el solape de la tarjeta blanca de las
      // pantallas (-mt-7 = 28px) + un margen visible bajo el subtítulo; con
      // menos, el blanco tapa el texto del header.
      style={{
        // 24 cuando el contenido va limitado (pantalla ancha): así el texto
        // arranca exactamente en el mismo borde que el px-6 de la tarjeta.
        paddingHorizontal: contentMaxWidth ? 24 : 28,
        paddingBottom: compact ? 40 : 60,
      }}
    >
      <SafeAreaView edges={['top']}>
        <View
          style={
            contentMaxWidth
              ? { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }
              : undefined
          }
        >
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
            {/* Sobre el degradado de marca (blanco→rojo) SIEMPRE fijo, no sobre
                bg-surface/bg-card: blanco para que contraste contra el rojo del
                degradado, sin importar el tema. Pedido del cliente: "Mandalo"
                sin tilde acá (el nombre oficial con tilde sigue igual en el
                resto de la app). */}
            <Text className="text-[50px] font-extrabold tracking-tighter text-white">
              Mandalo.
            </Text>
            <Text className="mt-0.5 text-lg font-extrabold text-white">
              {subtitle}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
