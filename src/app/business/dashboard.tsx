import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickAction } from '@/components/ui/quick-action';
import { SectionTitle } from '@/components/ui/section-title';
import { StatCard } from '@/components/ui/stat-card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePendingOrdersCount } from '@/hooks/use-pending-orders-count';
import { useSession } from '@/hooks/use-session';
import { BusinessDashboardStats, dashboardService } from '@/services/dashboard';
import { getAppColors } from '@/lib/app-colors';

type Stats = {
  [K in keyof BusinessDashboardStats]: BusinessDashboardStats[K] | null;
};

const EMPTY: Stats = {
  activeOrders: null,
  deliveredOrders: null,
  products: null,
};

/**
 * Inicio del panel del negocio: contadores de SUS pedidos y productos (el
 * backend limita todo al negocio del JWT). "Pedidos pendientes" viene del
 * mismo store compartido que el badge del sidebar (`usePendingOrdersCount`,
 * en vivo por socket) — el resto sale de UNA sola petición
 * (`/dashboard/business`), antes eran 4 peticiones separadas.
 */
export default function BusinessDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats>(EMPTY);
  // Primera carga: loader en vez de tarjetas vacías que "explotan" al llegar.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Evita que deslizar repetido para recargar dispare peticiones en paralelo.
  const busyRef = useRef(false);

  // Saludo del héroe (useSession: regla React Compiler, no getSession suelto).
  const firstName = useSession()?.user.fullName?.split(' ')[0];
  const pendingOrders = usePendingOrdersCount();

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (mode === 'refresh') setRefreshing(true);
    try {
      const res = await dashboardService.business();
      setStats(res.data);
    } catch {
      // El interceptor HTTP ya mostró el error; sin esto el spinner quedaba
      // infinito cuando la petición fallaba.
    } finally {
      setLoading(false);
      setRefreshing(false);
      busyRef.current = false;
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
          tintColor={getAppColors().primaryColor}
        />
      }
    >
      {/* Héroe de marca: continúa el header oscuro del drawer */}
      <View className="rounded-b-[28px] bg-dark px-5 pb-6 pt-1">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-white">
              ¡Hola{firstName ? `, ${firstName}` : ''}!
            </Text>
            <Text className="mt-0.5 text-xs text-white/70">
              Así va{' '}
              <Text className="font-extrabold text-primary-soft">tu negocio</Text>{' '}
              hoy.
            </Text>
          </View>
          <ThemeToggle
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70"
            iconColor="#FFFFFF"
          />
        </View>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color={getAppColors().primaryColor}
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
          value={pendingOrders}
          highlight={pendingOrders > 0}
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

      <View className="pt-5">
        <SectionTitle label="Accesos rápidos" />
      </View>
      <View className="flex-row flex-wrap gap-3 px-4">
        <QuickAction
          icon="cash-outline"
          label="Mis pagos"
          onPress={() => router.navigate('/business/earnings')}
        />
        <QuickAction
          icon="cube-outline"
          label="Mis productos"
          onPress={() => router.navigate('/business/products')}
        />
        <QuickAction
          icon="storefront-outline"
          label="Mi negocio"
          onPress={() => router.navigate('/business/profile')}
        />
      </View>
      </>
      )}
    </ScrollView>
  );
}
