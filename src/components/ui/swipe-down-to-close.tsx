import { ReactNode, useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** Arrastre (px) o velocidad (px/s) hacia abajo a partir de los que se cierra. */
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 900;

/**
 * Lógica de "arrastrar hacia abajo para cerrar" una hoja inferior: el
 * `gesture` va en la zona que se puede agarrar (toda la hoja o solo una
 * parte, p. ej. la foto de arriba si abajo hay un scroll) y el
 * `animatedStyle` en la hoja entera, que sigue al dedo. Si se suelta lejos o
 * rápido sale de la pantalla y llama `onClose`; si no, vuelve a su lugar.
 * Solo se activa con arrastre vertical hacia abajo (los horizontales, como un
 * carrusel, y los toques pasan normal).
 *
 * Dentro de un `<Modal>` de Android hace falta envolver el contenido del
 * Modal en `GestureHandlerRootView` (igual que `photo-editor.tsx`).
 */
export function useSwipeDownToClose({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const translateY = useSharedValue(0);

  // Cada vez que la hoja se abre, arranca en su lugar.
  useEffect(() => {
    if (visible) translateY.set(0);
  }, [visible, translateY]);

  const gesture = Gesture.Pan()
    .activeOffsetY(12)
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      translateY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > CLOSE_VELOCITY) {
        translateY.set(
          withTiming(800, { duration: 180 }, () => {
            scheduleOnRN(onClose);
          }),
        );
      } else {
        translateY.set(withSpring(0, { damping: 18, stiffness: 220 }));
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  return { gesture, animatedStyle };
}

type Props = {
  children: ReactNode;
  onClose: () => void;
  /** Vuelve a la posición inicial cada vez que la hoja se abre. */
  visible: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Hoja que se agarra desde CUALQUIER parte (sin scroll adentro). */
export function SwipeDownToClose({ children, onClose, visible, className, style }: Props) {
  const { gesture, animatedStyle } = useSwipeDownToClose({ visible, onClose });
  return (
    <GestureDetector gesture={gesture}>
      {/* `className` va en un View normal ADENTRO: en web, NativeWind no
          aplica clases a la vista animada de Reanimated (la hoja salía sin
          fondo, transparente). La animada solo lleva el transform. */}
      <Animated.View style={animatedStyle}>
        <View className={className} style={style}>
          {children}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
