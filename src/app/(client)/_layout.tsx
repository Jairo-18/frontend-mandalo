import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { PlatformPressable } from 'expo-router/react-navigation';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useSession } from '@/hooks/use-session';
import { useUnreadChats } from '@/hooks/use-unread-chats';
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
 * Panel del cliente (rol USER): menú inferior (Inicio, Pedidos, Chats,
 * Direcciones, Perfil) — antes era un drawer lateral. El grupo `(client)` no
 * cambia las URLs: /home, /orders y /profile siguen igual. Los flujos
 * full-screen (store, checkout) viven FUERA del grupo y se abren empujados
 * encima.
 */
export default function ClientLayout() {
  const router = useRouter();
  // Reactivo de verdad (no el singleton `getAppColors()`), ver
  // hooks/use-resolved-app-colors.ts.
  const colors = useResolvedAppColors();
  // undefined = cargando de SecureStore; null = sin sesión.
  const [session, setSession] = useState<Session | null | undefined>(
    () => getSession() ?? undefined,
  );

  useEffect(() => {
    if (!session) loadSession().then(setSession);
  }, [session]);

  // Reactivo (regla React Compiler §23): el badge de "Mis chats" no se
  // quedaría pegado en 0 sin este hook en vez de leer el singleton suelto.
  const user = useSession()?.user;
  const unreadChats = useUnreadChats();

  if (session === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <ActivityIndicator size="large" color={colors.primaryColor} />
      </View>
    );
  }

  // Sesión null = INVITADO: se le deja explorar el home (§44). Solo un usuario
  // logueado de OTRO rol rebota a su panel (mismo patrón que admin/business).
  const roleCode = session?.user.role?.code;
  if (roleCode && roleCode !== 'USER') {
    return <Redirect href={homePathFor(session!.user)} />;
  }

  const isGuest = !user;

  /**
   * Invitado tocando una pestaña con cuenta → lo manda a iniciar sesión.
   * OJO: tiene que ser PlatformPressable (no un Pressable a secas) — en web
   * es quien hace `e.preventDefault()` en el click antes de navegar; con un
   * Pressable normal, el `href` que expo-router le pasa a cada pestaña
   * termina disparando la navegación NATIVA del navegador (recarga completa
   * de página, se veía como "Cargando Mandalo" en cada tap del menú).
   */
  function guardedTabBarButton({ onPress, ...rest }: any) {
    return (
      <PlatformPressable
        {...rest}
        onPress={isGuest ? () => router.push('/auth/login') : onPress}
      />
    );
  }

  return (
    <>
      <PaymentRequestedListener />
      <Tabs
        screenOptions={{
          // Cada pantalla dibuja su propia navbar.
          headerShown: false,
          sceneStyle: { backgroundColor: colors.surfaceColor },
          tabBarActiveTintColor: colors.primaryColor,
          tabBarInactiveTintColor: colors.mutedColor,
          tabBarStyle: {
            backgroundColor: colors.cardColor,
            borderTopColor: colors.borderColor,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={size}
                color={color}
              />
            ),
            tabBarButton: guardedTabBarButton,
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Chats',
            tabBarBadge: unreadChats > 0 ? unreadChats : undefined,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={size}
                color={color}
              />
            ),
            tabBarButton: guardedTabBarButton,
          }}
        />
        <Tabs.Screen
          name="addresses"
          options={{
            title: 'Direcciones',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'location' : 'location-outline'}
                size={size}
                color={color}
              />
            ),
            tabBarButton: guardedTabBarButton,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={size}
                color={color}
              />
            ),
            tabBarButton: guardedTabBarButton,
          }}
        />
        {/* Ruta propia, sin item en la barra: se llega desde Mi perfil. */}
        <Tabs.Screen
          name="change-password"
          options={{ href: null, title: 'Cambiar contraseña' }}
        />
      </Tabs>
    </>
  );
}
