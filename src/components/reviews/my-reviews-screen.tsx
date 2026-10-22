import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, Pressable, View } from 'react-native';

import { ReviewsList } from '@/components/reviews/reviews-list';
import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';
import { useSession } from '@/hooks/use-session';
import { profilePathFor } from '@/lib/session';
import { useReviewReceived } from '@/lib/orders-socket';
import { reviewsService } from '@/services/reviews';

/**
 * "Mis reseñas" del cliente y del repartidor (ruta oculta, se entra desde
 * "Mi cuenta"): el promedio y las reseñas que recibí, más nuevas primero.
 * El negocio tiene su propia ruta en el drawer (`business/reviews.tsx`).
 */
export function MyReviewsScreen() {
  // Llegó una reseña nueva (socket): se recarga la lista y el promedio.
  const [reloadKey, setReloadKey] = useState(0);
  useReviewReceived(useCallback(() => setReloadKey((k) => k + 1), []));
  const router = useRouter();
  const session = useSession();
  const profileHref = profilePathFor(session?.user);

  // replace a "Mi cuenta" (no back()): en un Tabs, back() vuelve a la primera
  // pestaña (el home). Igual con el botón atrás de Android.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace(profileHref);
        return true;
      });
      return () => sub.remove();
    }, [router, profileHref]),
  );

  return (
    <PanelSafeArea>
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        <PanelHeader
          title="Mis reseñas"
          subtitle="Lo que opinan de ti en tus pedidos"
          menu={
            <Pressable
              onPress={() => router.replace(profileHref)}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </Pressable>
          }
        />
        <ReviewsList
          key={reloadKey}
          fetchPage={(page) => reviewsService.mine(page)}
          emptyMessage="Aún no tienes reseñas. Aparecerán aquí cuando te califiquen al terminar un pedido."
        />
      </View>
    </PanelSafeArea>
  );
}
