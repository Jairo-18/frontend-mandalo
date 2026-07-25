import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ClientDrawerContent } from '@/components/client/drawer-content';
import { useAppTheme } from '@/context/app-theme';
import { getSession, homePathFor, loadSession, Session } from '@/lib/session';
import { toast } from '@/lib/toast';
import {
  PaymentRequestedEvent,
  usePaymentRequested,
} from '@/lib/orders-socket';

/**
 * Escucha el aviso "el negocio necesita tu comprobante de pago" mientras el
 * cliente tiene la app abierta (el push cubre la app cerrada) y lo muestra
 * como toast. Sin UI propia; vive dentro del panel del cliente.
 */
function PaymentRequestedListener() {
  usePaymentRequested(
    useCallback((event: PaymentRequestedEvent) => {
      toast.error(event.message);
    }, []),
  );
  return null;
}

/**
 * Panel del cliente (rol USER): drawer con sidebar a la izquierda (Explorar,
 * Mis pedidos, Mi perfil). El grupo `(client)` no cambia las URLs: /home,
 * /orders y /profile siguen igual. Los flujos full-screen (store, checkout)
 * viven FUERA del grupo y se abren empujados encima.
 */
export default function ClientLayout() {
  const { isDark } = useAppTheme();
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
        <ActivityIndicator size="large" color="#FF5A3C" />
      </View>
    );
  }

  // Sesión null = INVITADO: se le deja explorar el home (§44). Solo un usuario
  // logueado de OTRO rol rebota a su panel (mismo patrón que admin/business).
  const roleCode = session?.user.role?.code;
  if (roleCode && roleCode !== 'USER') {
    return <Redirect href={homePathFor(session!.user)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaymentRequestedListener />
      <Drawer
        drawerContent={(props) => <ClientDrawerContent {...props} />}
        screenOptions={{
          // Cada pantalla dibuja su propia navbar (con el botón hamburguesa).
          headerShown: false,
          drawerStyle: { width: 300 },
          sceneStyle: { backgroundColor: isDark ? '#12121B' : '#F2F2F2' },
        }}
      >
        <Drawer.Screen name="home" options={{ title: 'Explorar' }} />
        <Drawer.Screen name="orders" options={{ title: 'Mis pedidos' }} />
        <Drawer.Screen name="chats" options={{ title: 'Mis chats' }} />
        <Drawer.Screen name="addresses" options={{ title: 'Mis direcciones' }} />
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
