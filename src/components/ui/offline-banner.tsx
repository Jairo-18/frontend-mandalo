import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus } from '@/lib/network-status';

/**
 * Aviso persistente cuando se confirma que no hay internet (no parpadea al
 * abrir la app: `useNetworkStatus` solo marca offline con señal confirmada,
 * nunca mientras el primer chequeo de NetInfo está indeterminado). Se monta
 * una sola vez en el layout raíz, por encima de toda la navegación, así se ve
 * sin importar en qué pantalla/rol esté el usuario.
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 100 }}
      className="flex-row items-center justify-center gap-2 bg-dark px-4 py-2"
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
      <Text className="text-[13px] font-semibold text-white">
        Sin conexión a internet
      </Text>
    </View>
  );
}
