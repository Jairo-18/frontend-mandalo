import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionTitle } from '@/components/ui/section-title';
import { countOf, StatCard } from '@/components/ui/stat-card';
import { useSession } from '@/hooks/use-session';
import { businessService } from '@/services/business';
import { ordersService } from '@/services/orders';

type Stats = {
  pendingOrders: number | null;
  activeOrders: number | null;
  deliveredOrders: number | null;
  products: number | null;
};

const EMPTY: Stats = {
  pendingOrders: null,
  activeOrders: null,
  deliveredOrders: null,
  products: null,
};

/**
 * Inicio del panel del negocio: contadores de SUS pedidos y productos (el
 * backend limita todo al negocio del JWT). Espejo del dashboard admin: los
 * números salen del `pagination.total` de los listados (perPage=1) y cada
 * tarjeta navega a su sección.
 */
export default function BusinessDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats>(EMPTY);
  // Primera carga: loader en vez de tarjetas vacías que "explotan" al llegar.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Saludo del héroe (useSession: regla React Compiler, no getSession suelto).
  const firstName = useSession()?.user.fullName?.split(' ')[0];

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    const page = { page: 1, perPage: 1 } as const;
    try {
      const [pendingOrders, activeOrders, deliveredOrders, products] =
        await Promise.all([
          countOf(ordersService.paginated({ ...page, stateCodes: ['PEND'] })),
          countOf(
            ordersService.paginated({
              ...page,
              stateCodes: ['ACEP', 'PREP', 'RUTA'],
            }),
          ),
          countOf(ordersService.paginated({ ...page, stateCodes: ['ENTR'] })),
          countOf(businessService.products.paginated(page)),
        ]);
      setStats({ pendingOrders, activeOrders, deliveredOrders, products });
    } catch {
      // El interceptor HTTP ya mostró el error; sin esto el spinner quedaba
      // infinito cuando alguna de las peticiones fallaba.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load('refresh')}
          tintColor="#FF5A3C"
        />
      }
    >
      {/* Héroe de marca: continúa el header oscuro del drawer */}
      <View className="rounded-b-[28px] bg-dark px-5 pb-6 pt-1">
        <Text className="text-2xl font-extrabold text-white">
          ¡Hola{firstName ? `, ${firstName}` : ''}!
        </Text>
        <Text className="mt-0.5 text-xs text-white/70">
          Así va{' '}
          <Text className="font-extrabold text-primary-soft">tu negocio</Text>{' '}
          hoy.
        </Text>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#FF5A3C"
          style={{ paddingTop: 48 }}
        />
      )}

      {!loading && (
      <>
      <View className="pt-4">
        <SectionTitle label="Resumen de mi negocio" />
      </View>

      <View className="flex-row flex-wrap gap-3 px-4">
        <StatCard
          icon="receipt-outline"
          label="Pedidos pendientes"
          value={stats.pendingOrders}
          highlight={(stats.pendingOrders ?? 0) > 0}
          onPress={() => router.navigate('/business/orders')}
        />
        <StatCard
          icon="time-outline"
          label="Pedidos en curso"
          value={stats.activeOrders}
          onPress={() => router.navigate('/business/orders')}
        />
        <StatCard
          icon="checkmark-done-outline"
          label="Pedidos entregados"
          value={stats.deliveredOrders}
          onPress={() => router.navigate('/business/orders')}
        />
        <StatCard
          icon="cube-outline"
          label="Productos"
          value={stats.products}
          onPress={() => router.navigate('/business/products')}
        />
      </View>
      </>
      )}
    </ScrollView>
  );
}
