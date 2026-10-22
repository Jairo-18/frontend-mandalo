import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** Pausa entre "olas": cada ícono salta una vez cada CYCLE_MS. */
const CYCLE_MS = 4000;
/** Desfase entre íconos vecinos, para que la ola recorra la fila. */
const STAGGER_MS = 140;

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  /** Posición en la fila: escalona la entrada y el salto. */
  index: number;
  /** Fondo circular con el color de marca al 12% (fila de íconos sueltos). */
  bubble?: boolean;
};

/**
 * Ícono de red social con su color de marca y una animación sutil: entra con
 * un "pop" escalonado y luego, cada pocos segundos, da un saltito con leve
 * giro — en ola de izquierda a derecha según `index`. Se usa en login/registro
 * (`SocialContactBar`), Ayuda y Mi perfil.
 */
export function AnimatedSocialIcon({ icon, color, size, index, bubble }: Props) {
  const scale = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * STAGGER_MS, withSpring(1, { damping: 9, stiffness: 160 }));
    lift.value = withDelay(
      800 + index * STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
          withSpring(0, { damping: 6, stiffness: 220 }),
          withTiming(0, { duration: CYCLE_MS }),
        ),
        -1,
      ),
    );
  }, [index, scale, lift]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * (1 + lift.value * 0.12) },
      { translateY: -lift.value * 4 },
      { rotate: `${lift.value * -8}deg` },
    ],
  }));

  if (bubble) {
    return (
      <Animated.View
        style={[
          style,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}1F`,
          },
        ]}
      >
        <Ionicons name={icon} size={size} color={color} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={style}>
      <Ionicons name={icon} size={size} color={color} />
    </Animated.View>
  );
}
