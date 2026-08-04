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
import { LinearGradient } from 'expo-linear-gradient';

import { QuickAction } from '@/components/ui/quick-action';
import { SectionTitle } from '@/components/ui/section-title';
import { StatCard } from '@/components/ui/stat-card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSession } from '@/hooks/use-session';
import { AdminDashboardStats, dashboardService } from '@/services/dashboard';
import { formatPrice } from '@/lib/price';
import { getAppColors } from '@/lib/app-colors';

type Stats = {
  [K in keyof AdminDashboardStats]: AdminDashboardStats[K] | null;
};

const EMPTY: Stats = {
  users: null,
  businesses: null,
  deliveries: null,
  pendingDeliveries: null,
  pendingOrders: null,
  activeOrders: null,
  serviceFeeTotal: null,
};

/**
 * Inicio del panel admin: contadores generales para ver el estado del negocio
 * de un vistazo. Cada tarjeta navega a su sección. Todos los números salen de
 * UNA sola petición (`/dashboard/admin`) — antes eran 7 peticiones separadas
 * (perPage=1 en cada listado solo para leer `pagination.total`).
 */
export default function AdminDashboardScreen() {
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

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (mode === 'refresh') setRefreshing(true);
    try {
      const res = await dashboardService.admin();
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
      {/* Héroe de marca: continúa el header de degradado del drawer */}
      <LinearGradient
        colors={[getAppColors().primaryColor, getAppColors().darkColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <View className="flex-row items-start justify-between px-5 pb-6 pt-1">
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-white">
              ¡Hola{firstName ? `, ${firstName}` : ''}!
            </Text>
            <Text className="mt-0.5 text-xs text-white/70">
              Así va{' '}
              <Text className="font-extrabold text-primary-soft">Mandalo</Text> hoy.
            </Text>
          </View>
          <ThemeToggle
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70"
            iconColor="#FFFFFF"
          />
        </View>
      </LinearGradient>

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
          label="Domiciliarios por activar"
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
          label="Domiciliarios"
          value={stats.deliveries}
          onPress={() => router.navigate('/admin/deliveries')}
        />
        <StatCard
          icon="cash-outline"
          label="Ingresos por servicio"
          value={
            stats.serviceFeeTotal != null ? formatPrice(stats.serviceFeeTotal) : null
          }
        />
      </View>

      <View className="pt-5">
        <SectionTitle label="Accesos rápidos" />
      </View>
      <View className="flex-row flex-wrap gap-3 px-4">
        <QuickAction
          icon="receipt-outline"
          label="Pedidos"
          onPress={() => router.navigate('/admin/orders')}
        />
        <QuickAction
          icon="storefront-outline"
          label="Negocios"
          onPress={() => router.navigate('/admin/businesses')}
        />
        <QuickAction
          icon="people-outline"
          label="Usuarios"
          onPress={() => router.navigate('/admin/users')}
        />
        <QuickAction
          icon="bicycle-outline"
          label="Domiciliarios"
          onPress={() => router.navigate('/admin/deliveries')}
        />
        <QuickAction
          icon="pricetags-outline"
          label="Etiquetas"
          onPress={() => router.navigate('/admin/tags')}
        />
        <QuickAction
          icon="grid-outline"
          label="Categorías"
          onPress={() => router.navigate('/admin/categories')}
        />
        <QuickAction
          icon="color-palette-outline"
          label="Aplicación"
          onPress={() => router.navigate('/admin/app-settings')}
        />
      </View>
      </>
      )}
    </ScrollView>
  );
}
