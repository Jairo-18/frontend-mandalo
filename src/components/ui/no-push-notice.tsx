import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { usePushUnavailable } from '@/lib/push';

/**
 * Aviso para el negocio y el repartidor cuando el teléfono NO puede recibir
 * notificaciones push (Android sin Google Mobile Services: los Huawei de la
 * AppGallery, ver `lib/google-services.ts`).
 *
 * No es un error que se pueda reintentar: FCM necesita GMS y punto. Lo único
 * accionable es que mantengan la app abierta — con la app en primer plano los
 * pedidos siguen entrando en vivo por el socket (`orders-socket.ts`), que es
 * justo lo que este aviso les pide.
 *
 * En cualquier otro dispositivo (incluidos los Huawei viejos, que sí traen
 * GMS) el componente es `null` y no ocupa nada.
 */
export function NoPushNotice() {
  const unavailable = usePushUnavailable();

  if (!unavailable) return null;

  // Colores fijos de la paleta ámbar (no tokens del tema), mismo patrón que
  // los otros avisos de la app: sobre `bg-amber-50` el texto tiene que ser
  // oscuro en los DOS temas, y `text-ink` se vuelve claro en oscuro.
  return (
    <View className="mx-4 mb-3 flex-row gap-2 rounded-2xl bg-amber-50 p-3.5">
      <Ionicons
        name="notifications-off-outline"
        size={18}
        color="#B45309"
        style={{ marginTop: 1 }}
      />
      <View className="flex-1">
        <Text className="text-[13px] font-bold text-amber-700">
          Este teléfono no recibe notificaciones
        </Text>
        <Text className="mt-0.5 text-[12px] leading-4 text-amber-700">
          No tiene los servicios de Google que usa el sistema de avisos. Deja
          la app abierta para ver los pedidos nuevos apenas entran.
        </Text>
      </View>
    </View>
  );
}
