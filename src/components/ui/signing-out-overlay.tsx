import { useSyncExternalStore } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { isSigningOut, subscribeSigningOut } from '@/lib/sign-out';
import { useAppTheme } from '@/context/app-theme';

/**
 * Pantalla completa "Cerrando sesión…" mientras corre `signOutEverywhere`:
 * tapa el flash de las pantallas vaciándose (drawer sin nombre, listas en
 * blanco) entre limpiar la sesión y que el login quede montado. Vive en el
 * layout raíz; se muestra sola vía el store de `lib/sign-out`.
 */
export function SigningOutOverlay() {
  const visible = useSyncExternalStore(subscribeSigningOut, isSigningOut);
  const { isDark } = useAppTheme();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-dark">
        <Text className="text-2xl font-extrabold text-white">Mandalo</Text>
        <ActivityIndicator
          size="large"
          color={isDark ? '#FFFFFF' : '#000000'}
          style={{ marginTop: 24 }}
        />
        <Text className="mt-4 text-sm text-white/70">Cerrando sesión…</Text>
      </View>
    </Modal>
  );
}
