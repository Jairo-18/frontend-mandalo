import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 600;
// Tiempo mínimo que el mapa se ve fijo en pantalla, pedido por el cliente,
// desacoplado de cuánto tarde en cargar de verdad la app (AppDataProvider/
// sesión) por debajo — si carga antes, igual se espera este mínimo.
const MIN_VISIBLE_MS = 3000;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  // El splash NATIVO (app.json → expo-splash-screen) solo puede mostrar un
  // ícono chico dentro de una zona segura que el propio SO recorta — ahí no
  // cabe el logotipo completo. Esta capa JS no tiene esa limitación: fondo a
  // pantalla completa con el mapa de marca + el logotipo completo (M +
  // "Mándalo" + tagline) encima, mismo rojo que el splash nativo para que el
  // paso de uno a otro no se note.
  const content = (
    <>
      <Image
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        source={require('@/assets/images/splash-icon.jpg')}
      />
      <Image
        style={styles.logo}
        contentFit="contain"
        source={require('@/assets/images/splash-logo-lockup.png')}
      />
    </>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {content}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setTimeout(() => setAnimate(true), MIN_VISIBLE_MS);
        });
      }}
      style={styles.splashOverlay}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  // Centrado (no 'top: 30%'): el splash NATIVO siempre centra su ícono en
  // medio de la pantalla, sin opción de moverlo — si el logo de acá quedaba
  // más arriba, el salto de posición al pasar de nativo a esta capa se
  // notaba como "dos pantallas" en vez de una sola transición.
  logo: {
    width: 220,
    height: 222,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    // Mismo rojo que el centro del mapa (app.json usa el mismo tono) —
    // fallback mientras decodifica el JPG, para que no haya flash de por medio.
    backgroundColor: '#A3070B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
