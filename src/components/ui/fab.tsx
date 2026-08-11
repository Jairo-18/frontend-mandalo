import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

const SIZE = 56;
const PLUS_LENGTH = 20;
const PLUS_THICKNESS = 3;
// Corrección manual calibrada con el usuario contra la guía amarilla: el
// centro matemático (SIZE/2) rendía el "+" visualmente 3px a la derecha y
// 3px abajo de donde debía verse.
const OFFSET_X = -3;
const OFFSET_Y = -3;

/** Botón flotante de crear (queda arriba del paginador). Degradado de marca
 * (antes `bg-primary` sólido). */
export function Fab({ onPress, icon }: Props) {
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
        style={{ width: SIZE, height: SIZE }}
      >
        {icon ? (
          <View
            style={{
              width: SIZE,
              height: SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={30} color="#FFFFFF" />
          </View>
        ) : (
          // Cruz dibujada a mano (dos barras con posición absoluta calculada
          // a partir de SIZE): el glifo "add" de Ionicons nunca quedó bien
          // centrado en este botón tan chico (ni con marginTop hasta 10px
          // se notaba el ajuste — parece que Android reserva un cuadro de
          // fuente más grande que el glifo visible). Con barras propias el
          // centrado es matemático, no depende de métricas de fuente.
          <>
            <View
              style={{
                position: 'absolute',
                top: SIZE / 2 - PLUS_THICKNESS / 2 + OFFSET_Y,
                left: SIZE / 2 - PLUS_LENGTH / 2 + OFFSET_X,
                width: PLUS_LENGTH,
                height: PLUS_THICKNESS,
                borderRadius: PLUS_THICKNESS / 2,
                backgroundColor: '#FFFFFF',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: SIZE / 2 - PLUS_LENGTH / 2 + OFFSET_Y,
                left: SIZE / 2 - PLUS_THICKNESS / 2 + OFFSET_X,
                width: PLUS_THICKNESS,
                height: PLUS_LENGTH,
                borderRadius: PLUS_THICKNESS / 2,
                backgroundColor: '#FFFFFF',
              }}
            />
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}
