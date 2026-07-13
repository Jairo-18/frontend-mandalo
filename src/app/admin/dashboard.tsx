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
import { adminBusinessesService } from '@/services/admin-businesses';
import { adminUsersService } from '@/services/admin-users';
import { ordersService } from '@/services/orders';

type Stats = {
  users: number | null;
  businesses: number | null;
  deliveries: number | null;
  pendingDeliveries: number | null;
  pendingOrders: number | null;
  activeOrders: number | null;
};

const EMPTY: Stats = {
  users: null,
  businesses: null,
  deliveries: null,
  pendingDeliveries: null,
  pendingOrders: null,
  activeOrders: null,
};

/**
 * Inicio del panel admin: contadores generales para ver el estado del negocio
 * de un vistazo. Cada tarjeta navega a su sección. Los números salen del
 * `pagination.total` de los listados (perPage=1) — sin endpoints nuevos.
 */
export default function AdminDashboardScreen() {
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
    const [users, businesses, deliveries, pendingDeliveries, pendingOrders, activeOrders] =
      await Promise.all([
        countOf(adminUsersService.paginated({ ...page, roleTypeCodes: ['USER'] })),
        countOf(adminBusinessesService.paginated(page)),
        countOf(adminUsersService.paginated({ ...page, roleTypeCodes: ['DELI'] })),
        countOf(
          adminUsersService.paginated({
            ...page,
            roleTypeCodes: ['DELI'],
            isActive: false,
          }),
        ),
        countOf(ordersService.paginated({ ...page, stateCodes: ['PEND'] })),
        countOf(
          ordersService.paginated({
            ...page,
            stateCodes: ['PEND', 'ACEP', 'PREP', 'RUTA'],
          }),
        ),
      ]);
    setStats({ users, businesses, deliveries, pendingDeliveries, pendingOrders, activeOrders });
    setLoading(false);
    setRefreshing(false);
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
          <Text className="font-extrabold text-primary-soft">Mándalo</Text> hoy.
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
        <SectionTitle label="Resumen general" />
      </View>

      <View className="flex-row flex-wrap gap-3 px-4">
        <StatCard
          icon="receipt-outline"
          label="Pedidos pendientes"
          value={stats.pendingOrders}
          highlight={(stats.pendingOrders ?? 0) > 0}
          onPress={() => router.navigate('/admin/orders')}
        />
        <StatCard
          icon="bicycle-outline"
          label="Repartidores por activar"
          value={stats.pendingDeliveries}
          highlight={(stats.pendingDeliveries ?? 0) > 0}
          onPress={() => router.navigate('/admin/deliveries')}
        />
        <StatCard
          icon="time-outline"
          label="Pedidos en curso"
          value={stats.activeOrders}
          onPress={() => router.navigate('/admin/orders')}
        />
        <StatCard
          icon="storefront-outline"
          label="Negocios"
          value={stats.businesses}
          onPress={() => router.navigate('/admin/businesses')}
        />
        <StatCard
          icon="people-outline"
          label="Usuarios"
          value={stats.users}
          onPress={() => router.navigate('/admin/users')}
        />
        <StatCard
          icon="bicycle-outline"
          label="Repartidores"
          value={stats.deliveries}
          onPress={() => router.navigate('/admin/deliveries')}
        />
      </View>
      </>
      )}
    </ScrollView>
  );
}
