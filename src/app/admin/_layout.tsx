import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AdminDrawerContent } from '@/components/admin/drawer-content';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { getSession, homePathFor, loadSession, Session } from '@/lib/session';


/**
 * Panel de administración (solo rol ADMIN): drawer con sidebar a la izquierda.
 * Si la sesión no es de un admin, se redirige a la vista de SU rol (no al
 * home del cliente: montarlo dispararía sus peticiones de explorar/direcciones).
 */
export default function AdminLayout() {
  // Reactivo de verdad (no el singleton `getAppColors()`): el Drawer necesita
  // recalcular sceneStyle/headerStyle cuando cambia el modo oscuro, ver
  // hooks/use-resolved-app-colors.ts.
  const colors = useResolvedAppColors();
  // undefined = cargando de SecureStore; null = sin sesión.
  const [session, setSession] = useState<Session | null | undefined>(
    () => getSession() ?? undefined,
  );

  useEffect(() => {
    if (!session) loadSession().then(setSession);
  }, [session]);

  if (session === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <ActivityIndicator size="large" color={colors.primaryColor} />
      </View>
    );
  }

  if (session?.user.role?.code !== 'ADMIN') {
    return <Redirect href={homePathFor(session?.user)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Header oscuro de marca (espejo del panel del cliente). */}
      <StatusBar style="light" />
      <Drawer
        drawerContent={(props) => <AdminDrawerContent {...props} />}
        screenOptions={{
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800', color: '#FFFFFF' },
          // Degradado primary→dark (pedido del cliente) en vez de un
          // `headerStyle.backgroundColor` plano — React Navigation permite
          // reemplazar el fondo del header por cualquier componente.
          headerBackground: () => (
            <LinearGradient
              colors={[colors.primaryColor, colors.darkColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          ),
          headerShadowVisible: false,
          drawerStyle: { width: 300 },
          sceneStyle: { backgroundColor: colors.surfaceColor },
        }}
      >
        <Drawer.Screen name="dashboard" options={{ title: 'Inicio' }} />
        <Drawer.Screen name="orders" options={{ title: 'Pedidos' }} />
        <Drawer.Screen name="businesses" options={{ title: 'Negocios' }} />
        {/* Facturación por negocio: no está en el sidebar — se entra desde
            el botón de la tarjeta en Negocios. */}
        <Drawer.Screen name="billing" options={{ title: 'Facturación' }} />
        <Drawer.Screen name="users" options={{ title: 'Usuarios' }} />
        <Drawer.Screen name="deliveries" options={{ title: 'Domiciliarios' }} />
        {/* Pagos por repartidor: no está en el sidebar — se entra desde el
            botón de la tarjeta en Domiciliarios (espejo de "billing"). */}
        <Drawer.Screen
          name="delivery-billing"
          options={{ title: 'Pagos al domiciliario' }}
        />
        <Drawer.Screen name="accidents" options={{ title: 'Accidentes' }} />
        <Drawer.Screen name="tags" options={{ title: 'Etiquetas' }} />
        <Drawer.Screen name="categories" options={{ title: 'Categorías' }} />
        <Drawer.Screen name="app-settings" options={{ title: 'Aplicación' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
