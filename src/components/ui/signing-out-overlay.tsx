import { LinearGradient } from 'expo-linear-gradient';
import { useSyncExternalStore } from 'react';
import { ActivityIndicator, Modal, Text } from 'react-native';

import { isSigningOut, subscribeSigningOut } from '@/lib/sign-out';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Pantalla completa "Cerrando sesión…" mientras corre `signOutEverywhere`:
 * tapa el flash de las pantallas vaciándose (drawer sin nombre, listas en
 * blanco) entre limpiar la sesión y que el login quede montado. Vive en el
 * layout raíz; se muestra sola vía el store de `lib/sign-out`. Degradado de
 * marca (antes `bg-dark` sólido) para que coincida con el resto de la app.
 */
export function SigningOutOverlay() {
  const visible = useSyncExternalStore(subscribeSigningOut, isSigningOut);
  const colors = useResolvedAppColors();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <LinearGradient
        colors={[colors.primaryColor, colors.darkColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text className="text-2xl font-extrabold text-white">Mandalo</Text>
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
          style={{ marginTop: 24 }}
        />
        <Text className="mt-4 text-sm text-white/70">Cerrando sesión…</Text>
      </LinearGradient>
    </Modal>
  );
}
