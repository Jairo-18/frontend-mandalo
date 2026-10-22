import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { ReviewsList } from '@/components/reviews/reviews-list';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getAppColors } from '@/lib/app-colors';
import { useReviewReceived } from '@/lib/orders-socket';
import { reviewsService } from '@/services/reviews';

/**
 * "Mis reseñas" del negocio: lo que clientes y domiciliarios opinan de él
 * (por ahora sin responder). Mismo header de degradado que "Mis pagos".
 */
export default function BusinessReviewsScreen() {
  // Llegó una reseña nueva (socket): se recarga la lista y el promedio.
  const [reloadKey, setReloadKey] = useState(0);
  useReviewReceived(useCallback(() => setReloadKey((k) => k + 1), []));
  return (
    <View className="flex-1 bg-surface">
      {/* Continúa el header de degradado del drawer (mismo patrón que dashboard/products). */}
      <LinearGradient
        colors={[getAppColors().primaryColor, getAppColors().darkColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <View className="flex-row items-center gap-3 px-5 pb-5 pt-1">
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-white">Mis reseñas</Text>
            <Text className="text-xs text-white/70">
              Lo que opinan clientes y domiciliarios de tu negocio
            </Text>
          </View>
          <ThemeToggle
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70"
            iconColor="#FFFFFF"
          />
        </View>
      </LinearGradient>

      <ReviewsList
        key={reloadKey}
        fetchPage={(page) => reviewsService.mine(page)}
        emptyMessage="Aún no tienes reseñas. Aparecerán aquí cuando te califiquen al terminar un pedido."
      />
    </View>
  );
}
