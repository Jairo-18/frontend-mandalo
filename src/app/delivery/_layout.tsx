import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DeliveryDrawerContent } from '@/components/delivery/drawer-content';
import { getSession, homePathFor, loadSession, Session } from '@/lib/session';

/**
 * Panel del repartidor (rol DELI): drawer con sidebar (Pedidos, Mi perfil).
 * La cuenta pendiente de habilitación también entra (el index muestra la
 * pantalla de "en proceso" y el perfil sigue editable). Otros roles rebotan
 * a SU panel.
 */
export default function DeliveryLayout() {
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

  if (session?.user.role?.code !== 'DELI') {
    return <Redirect href={homePathFor(session?.user)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <DeliveryDrawerContent {...props} />}
        screenOptions={{
          // Cada pantalla dibuja su propia navbar (con el botón hamburguesa).
          headerShown: false,
          drawerStyle: { width: 300 },
          sceneStyle: { backgroundColor: '#F2F2F2' },
        }}
      >
        <Drawer.Screen name="index" options={{ title: 'Pedidos' }} />
        <Drawer.Screen name="chats" options={{ title: 'Mis chats' }} />
        <Drawer.Screen name="profile" options={{ title: 'Mi perfil' }} />
        {/* Ruta propia, sin item en el sidebar: se llega desde Mi perfil. */}
        <Drawer.Screen
          name="change-password"
          options={{ title: 'Cambiar contraseña' }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
