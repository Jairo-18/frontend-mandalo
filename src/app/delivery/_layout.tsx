import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useUnreadChats } from '@/hooks/use-unread-chats';
import { getSession, homePathFor, loadSession, Session } from '@/lib/session';

/**
 * Panel del repartidor (rol DELI): menú inferior (Pedidos, Cobros, Chats,
 * Perfil) — antes era un drawer lateral. La cuenta pendiente de habilitación
 * también entra (el index muestra la pantalla de "en proceso" y el perfil
 * sigue editable). Otros roles rebotan a SU panel.
 */
export default function DeliveryLayout() {
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

  // Reactivo (regla React Compiler §23): el badge de "Chats" no se quedaría
  // pegado en 0 sin este hook.
  const unreadChats = useUnreadChats();

  if (session === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <ActivityIndicator size="large" color={colors.primaryColor} />
      </View>
    );
  }

  if (session?.user.role?.code !== 'DELI') {
    return <Redirect href={homePathFor(session?.user)} />;
  }

  return (
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
        name="index"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'bicycle' : 'bicycle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Cobros',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'cash' : 'cash-outline'}
              size={size}
              color={color}
            />
          ),
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
        }}
      />
      {/* Rutas propias, sin item en la barra: se llega desde Mi perfil o
          desde la pantalla de "Cuenta en proceso de habilitación". */}
      <Tabs.Screen
        name="change-password"
        options={{ href: null, title: 'Cambiar contraseña' }}
      />
      <Tabs.Screen
        name="resend-documents"
        options={{ href: null, title: 'Reenviar documentos' }}
      />
    </Tabs>
  );
}
