import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AdminDrawerContent } from '@/components/admin/drawer-content';
import { getSession, loadSession, Session } from '@/lib/session';

/**
 * Panel de administración (solo rol ADMIN): drawer con sidebar a la izquierda.
 * Si la sesión no es de un admin, se redirige al home normal.
 */
export default function AdminLayout() {
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

  if (session?.user.role?.code !== 'ADMIN') {
    return <Redirect href="/home" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <AdminDrawerContent {...props} />}
        screenOptions={{
          headerTintColor: '#1E1E2D',
          headerTitleStyle: { fontWeight: '800', color: '#1E1E2D' },
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          drawerStyle: { width: 300 },
          sceneStyle: { backgroundColor: '#F2F2F2' },
        }}
      >
        <Drawer.Screen name="businesses" options={{ title: 'Negocios' }} />
        <Drawer.Screen name="users" options={{ title: 'Usuarios' }} />
        <Drawer.Screen name="deliveries" options={{ title: 'Repartidores' }} />
        <Drawer.Screen name="tags" options={{ title: 'Etiquetas' }} />
        <Drawer.Screen name="categories" options={{ title: 'Categorías' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
