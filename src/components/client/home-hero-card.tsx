import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';

import { getAppColors } from '@/lib/app-colors';

type Props = {
  /** Primer nombre del usuario para el saludo; vacío/omitido en modo invitado. */
  name?: string;
};

/**
 * Tarjeta de marca del home del cliente ("Lo pides, lo mandamos."), debajo
 * del buscador y antes de las secciones de negocios/categorías — mockup del
 * usuario (image.png). Logo en blanco (silueta monocromática, la misma que
 * usa el ícono adaptable de Android) sobre el degradado de marca. El saludo
 * ("¡Hola!") vivía antes en la cabecera oscura del home — se movió acá para
 * dejar la cabecera solo con el buscador.
 */
export function HomeHeroCard({ name }: Props) {
  const { primaryColor, darkColor } = getAppColors();

  return (
    <View className="px-5 pt-4">
      <LinearGradient
        colors={[primaryColor, darkColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, overflow: 'hidden' }}
      >
        <View className="flex-row items-center justify-between px-5 py-5">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] font-bold text-white/90">
              ¡Hola{name ? `, ${name}` : ''}!
            </Text>
            <Text className="mb-2 text-[11px] text-white/70">
              ¿Qué necesitas hoy?
            </Text>
            <Text className="text-xl font-extrabold leading-6 text-white">
              Lo pides,{'\n'}lo mandamos.
            </Text>
            <Text className="mt-1.5 text-[13px] text-white/80">
              Rápido, fácil y seguro.
            </Text>
          </View>
          <Image
            source={require('@/assets/images/android-icon-monochrome.png')}
            style={{ width: 104, height: 104, opacity: 0.85 }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </View>
  );
}
