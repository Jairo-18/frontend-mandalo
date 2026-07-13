import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { BusinessDrawerContent } from '@/components/business/drawer-content';
import { getSession, homePathFor, loadSession, Session } from '@/lib/session';

/**
 * Panel del negocio (solo rol NEGO): drawer con sidebar a la izquierda,
 * espejo del panel admin. Si la sesión no es de un negocio, se redirige
 * a la vista que le corresponda.
 */
export default function BusinessLayout() {
  // undefined = cargando de SecureStore; null = sin sesión.
  const [session, setSession] = useState<Session | null | undefined>(
    () => getSession() ?? undefined,
  );

  useEffect(() => {
    if (!session) loadSession().then(setSession);
  }, [session]);

  if (session === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF5A3C" />
      </View>
    );
  }

  const role = session?.user.role?.code;
  if (role !== 'NEGO') {
    // A la vista de SU rol (no al home del cliente, que fetchea el explorar).
    return <Redirect href={homePathFor(session?.user)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Header oscuro de marca (espejo del panel del cliente). */}
      <StatusBar style="light" />
      <Drawer
        drawerContent={(props) => <BusinessDrawerContent {...props} />}
        screenOptions={{
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800', color: '#FFFFFF' },
          headerStyle: { backgroundColor: '#1E1E2D' },
          headerShadowVisible: false,
          drawerStyle: { width: 300 },
          sceneStyle: { backgroundColor: '#F2F2F2' },
        }}
      >
        <Drawer.Screen name="dashboard" options={{ title: 'Mi negocio' }} />
        <Drawer.Screen name="products" options={{ title: 'Productos' }} />
        <Drawer.Screen name="orders" options={{ title: 'Pedidos' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
